; Script Inno Setup 6 cho phan mem Kyodo Food Cham Cong (Bao gom ca 2 phien ban)
#define MyAppName "Kyodo Food"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "Kyodo Food"
#define MyAppURL "https://kyodofood.vn"

[Setup]
AppId={{E829B854-3D8B-4C92-A62E-0BA22F9E8732}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={userappdata}\KyodoFood
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\installer_output
OutputBaseFilename=Setup_Kyodo_Food_Cham_Cong
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
Name: "desktopicon"; Description: "Tao cac bieu tuong loi tat ngoai man hinh Desktop"; GroupDescription: "Bieu tuong Desktop:"; Flags: checkedonce

[Files]
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood-NhanVien.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood-QuanLy.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\Day-Len-GitHub.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\Cap-Nhat-Phan-Mem.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\kyodo-icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\bin\*"; DestDir: "{app}\bin"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autodesktop}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Tasks: desktopicon
Name: "{autodesktop}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Tasks: desktopicon
Name: "{group}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Day Ban Cap Nhat Len GitHub"; Filename: "{app}\Day-Len-GitHub.bat"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Cap Nhat Phan Mem Tu GitHub"; Filename: "{app}\Cap-Nhat-Phan-Mem.bat"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Go cai dat Kyodo Food"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\KyodoFood-NhanVien.vbs"; Description: "Khoi chay Kyodo Food - Nhan Vien Cham Cong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent
