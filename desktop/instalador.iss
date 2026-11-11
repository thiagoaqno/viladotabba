; Corrida da Galera — o instalador do programa de PC (Inno Setup), montado pelo workflow programa-pc.yml a partir da pasta dist\
; (o lançador, o node.exe e o jogo). Instala para o usuário, sem pedir administrador; o banco e as configurações ficam em
; %LOCALAPPDATA%\CorridaDaGalera e sobrevivem às atualizações (instalar a versão nova por cima).
#define Versao GetEnv("VERSAO_PC")
[Setup]
AppId={{6B3E5C21-9F0A-4C8E-A1D7-C0221DA6A1E5}
AppName=Corrida da Galera
AppVersion={#Versao}
AppPublisher=Vila da Galera
DefaultDirName={localappdata}\Programs\Corrida da Galera
DefaultGroupName=Corrida da Galera
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\saida
OutputBaseFilename=CorridaDaGalera-Setup
SetupIconFile=..\dist\corrida.ico
UninstallDisplayIcon={app}\Corrida da Galera.exe
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "pt"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "atalho"; Description: "Criar um atalho na área de trabalho"

[InstallDelete]
; a pasta do jogo é trocada inteira a cada versão (os arquivos que saíram do jogo não ficam para trás)
Type: filesandordirs; Name: "{app}\app"

[Files]
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\Corrida da Galera"; Filename: "{app}\Corrida da Galera.exe"
Name: "{userdesktop}\Corrida da Galera"; Filename: "{app}\Corrida da Galera.exe"; Tasks: atalho

[Run]
Filename: "{app}\Corrida da Galera.exe"; Description: "Abrir a Corrida da Galera"; Flags: nowait postinstall skipifsilent
