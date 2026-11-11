// Corrida da Galera — o lançador do programa de PC (Corrida da Galera.exe). Compilado pelo workflow programa-pc.yml com o csc do
// .NET Framework que já vem no Windows, sem nada para instalar. O que ele faz:
//  1. liga o servidor do jogo (node\node.exe app\server.js, sem janela) em 127.0.0.1:PORTA, com o banco em %LOCALAPPDATA%\CorridaDaGalera;
//     a porta é SEMPRE a mesma: o navegador guarda as configurações (controles, acerto, carreira) por endereço, e com outra porta sumiriam;
//  2. abre o jogo numa janela própria do Edge (--app, com um perfil só do jogo), que já vem no Windows; sem Edge, no navegador padrão;
//  3. quando a janela fecha, desliga o servidor.
// O endereço do site (para jogar online e mandar os recordes) vem de site.txt, ao lado do .exe (corrida-pc.js, CORRIDA_SITE).
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

static class Corrida {
  const int PORTA = 31517;
  // A janela do jogo é o motor do Chromium (o mesmo de um programa em Electron), num perfil só do jogo: sem abas, sem extensões, sem
  // nada da navegação do dia a dia. As chaves: a placa de vídeo FORTE nos notebooks com duas (sem ela, o Edge desenha na integrada:
  // medido num i7-10750H com Intel UHD + RTX 2060, 2026-11-11) e o jogo sem desacelerar quando a janela perde o foco. As de desenho que
  // tinham vindo junto (--enable-zero-copy, --enable-gpu-rasterization, --ignore-gpu-blocklist, CalculateNativeWinOcclusion) PIORAVAM:
  // na mesma corrida rápida de 21 robôs, 38 quadros/s com elas e 64 sem elas (Edge, RTX 2060).
  const string OTIMIZADO = " --force_high_performance_gpu --disable-extensions --disable-background-timer-throttling --disable-renderer-backgrounding";
  [STAThread]
  static void Main() {
    string pasta = AppDomain.CurrentDomain.BaseDirectory;
    string dados = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CorridaDaGalera");
    Directory.CreateDirectory(dados);
    string url = "http://127.0.0.1:" + PORTA + "/corrida/";
    Process servidor = null;
    if (!PortaAberta()) { // (já aberto: um segundo clique só abre outra janela no mesmo servidor)
      string site = "";
      try { site = File.ReadAllText(Path.Combine(pasta, "site.txt")).Trim(); } catch { }
      var p = new ProcessStartInfo(Path.Combine(pasta, "node", "node.exe"), "server.js") {
        WorkingDirectory = Path.Combine(pasta, "app"), UseShellExecute = false, CreateNoWindow = true,
        RedirectStandardOutput = true, RedirectStandardError = true,
      };
      p.EnvironmentVariables["PORT"] = PORTA.ToString();
      p.EnvironmentVariables["HOST"] = "127.0.0.1";
      p.EnvironmentVariables["NODE_ENV"] = "production";
      p.EnvironmentVariables["DB_PATH"] = Path.Combine(dados, "galera.db");
      p.EnvironmentVariables["CORRIDA_SITE"] = site;
      try {
        servidor = Process.Start(p);
        var log = new StreamWriter(Path.Combine(dados, "servidor.log"), false) { AutoFlush = true };
        servidor.OutputDataReceived += (s, e) => { if (e.Data != null) lock (log) log.WriteLine(e.Data); };
        servidor.ErrorDataReceived += (s, e) => { if (e.Data != null) lock (log) log.WriteLine(e.Data); };
        servidor.BeginOutputReadLine(); servidor.BeginErrorReadLine();
      } catch (Exception e) { MessageBox.Show("Não foi possível ligar o jogo: " + e.Message, "Corrida da Galera"); return; }
      // espera o jogo RESPONDER (não só a porta abrir), até 3 min: a primeira vez monta o banco e confere a atualização
      for (int i = 0; i < 1800 && !Responde(); i++) {
        if (servidor.HasExited) { MessageBox.Show("O jogo fechou ao ligar. Veja " + Path.Combine(dados, "servidor.log"), "Corrida da Galera"); return; }
        Thread.Sleep(100);
      }
    }
    string edge = AcharEdge();
    if (edge != null) {
      var janela = Process.Start(new ProcessStartInfo(edge, "--app=" + url + " --user-data-dir=\"" + Path.Combine(dados, "janela") + "\" --no-first-run --start-maximized --autoplay-policy=no-user-gesture-required" + OTIMIZADO) { UseShellExecute = false });
      janela.WaitForExit();
    } else {
      Process.Start(url);
      MessageBox.Show("A Corrida abriu no seu navegador. Feche esta mensagem quando terminar de jogar para desligar o jogo.", "Corrida da Galera");
    }
    if (servidor != null && !servidor.HasExited) { try { servidor.Kill(); } catch { } }
  }
  static bool Responde() {
    try {
      var r = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + PORTA + "/corrida/"); r.Timeout = 1500;
      using (var resp = (HttpWebResponse)r.GetResponse()) return (int)resp.StatusCode == 200;
    } catch { return false; }
  }
  static bool PortaAberta() {
    try { using (var c = new TcpClient()) { var r = c.BeginConnect(IPAddress.Loopback, PORTA, null, null); bool ok = r.AsyncWaitHandle.WaitOne(200) && c.Connected; return ok; } }
    catch { return false; }
  }
  static string AcharEdge() {
    foreach (var raiz in new[] { Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) }) {
      if (string.IsNullOrEmpty(raiz)) continue;
      string e = Path.Combine(raiz, "Microsoft", "Edge", "Application", "msedge.exe");
      if (File.Exists(e)) return e;
    }
    return null;
  }
}
