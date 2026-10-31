; Script Inno Setup 6 cho Phien Ban Nhan Vien Cham Cong - Kyodo Food
#define MyAppName "Kyodo Food - Nhan Vien Cham Cong"
#define MyAppVersion "1.5.2"
#define MyAppPublisher "Kyodo Food"
#define MyAppURL "https://kyodofood.vn"

[Setup]
AppId={{D1A2B3C4-4E5F-6A7B-8C9D-0E1F2A3B4C5D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={userappdata}\KyodoFoodNhanVien
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\installer_output
OutputBaseFilename=Setup_Kyodo_Food_Nhan_Vien
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
Name: "desktopicon"; Description: "Tao bieu tuong loi tat Nhan Vien Cham Cong ngoai Desktop"; GroupDescription: "Bieu tuong:"; Flags: checkedonce

[Files]
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood-NhanVien.vbs"; DestDir: "{app}"; Flags: ignoreversion
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
Name: "{autodesktop}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Tasks: desktopicon
Name: "{group}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Cap Nhat Phan Mem Tu GitHub"; Filename: "{app}\Cap-Nhat-Phan-Mem.bat"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Go cai dat Kyodo Food"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\KyodoFood-NhanVien.vbs"; Description: "Khoi chay Kyodo Food - Nhan Vien Cham Cong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent
