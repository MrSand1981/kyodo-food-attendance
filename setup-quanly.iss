; Script Inno Setup 6 cho Phien Ban Quan Ly & Bang Luong - Kyodo Food
#define MyAppName "Kyodo Food - Quan Ly & Bang Luong"
#define MyAppVersion "1.5.2"
#define MyAppPublisher "Kyodo Food"
#define MyAppURL "https://kyodofood.vn"

[Setup]
AppId={{F2B3C4D5-5E6F-7A8B-9C0D-1E2F3A4B5C6E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={userappdata}\KyodoFoodQuanLy
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\installer_output
OutputBaseFilename=Setup_Kyodo_Food_Quan_Ly
SetupIconFile=C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\kyodo-icon.ico
Compression=lzma2/ultra
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\kyodo-icon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Tao bieu tuong loi tat Quan Ly & Bang Luong ngoai Desktop"; GroupDescription: "Bieu tuong:"; Flags: checkedonce

[Files]
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood-QuanLy.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\Day-Len-GitHub.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\Cap-Nhat-Phan-Mem.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\kyodo-icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\bin\*"; DestDir: "{app}\bin"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\data\database.json"; DestDir: "{app}\data"; Flags: onlyifdoesntexist uninsneveruninstall
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\data\backups\*"; DestDir: "{app}\data\backups"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autodesktop}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Tasks: desktopicon
Name: "{group}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Day Ban Cap Nhat Len GitHub"; Filename: "{app}\Day-Len-GitHub.bat"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Cap Nhat Phan Mem Tu GitHub"; Filename: "{app}\Cap-Nhat-Phan-Mem.bat"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Go cai dat Kyodo Food"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\KyodoFood-QuanLy.vbs"; Description: "Khoi chay Kyodo Food - Quan Ly & Bang Luong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent
