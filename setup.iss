; =====================================================================
; KYODO FOOD - TRUNG NU VUONG, DA NANG
; BO CAI DAT CHUYEN NGHIEP (SINGLE INSTALLER) - HO TRO CLOUD VA TU CHON THU MUC
; =====================================================================

#define MyAppName "Kyodo Food"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "Kyodo Food - Trung Nu Vuong"
#define MyAppURL "https://github.com/MrSand1981/kyodo-food-attendance"

[Setup]
AppId={{D4E723B1-998C-4B11-857A-7928E43B3301}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\KyodoFood
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
DisableDirPage=no
UsePreviousAppDir=no
AlwaysShowDirOnReadyPage=yes
DirExistsWarning=no
EnableDirDoesntExistWarning=no
OutputDir=C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\installer_output
OutputBaseFilename=Setup_Kyodo_Food
SetupIconFile=C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\kyodo-icon.ico
Compression=lzma2/ultra
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\kyodo-icon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood-NhanVien.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood-QuanLy.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\KyodoFood.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\cloud_config.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\Day-Len-GitHub.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\Cap-Nhat-Phan-Mem.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\kyodo-icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\bin\*"; DestDir: "{app}\bin"; Flags: ignoreversion recursesubdirs createallsubdirs
; File du lieu database.json va kyodo_employee_vault.json: TUYET DOI KHONG GHI DE khi cap nhat (chi tao moi khi may chua tung cai dat)
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\data\database.json"; DestDir: "{app}\data"; Flags: onlyifdoesntexist uninsneveruninstall
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\data\kyodo_employee_vault.json"; DestDir: "{app}\data"; Flags: onlyifdoesntexist uninsneveruninstall
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\data\backups\*"; DestDir: "{app}\data\backups"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\Sand\.gemini\antigravity\scratch\kyodo-food-attendance\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Shortcut danh cho Nhan Vien (Khong hien thi muc luong)
Name: "{autodesktop}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsEmployeeInstall
Name: "{group}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsEmployeeInstall

; Shortcut danh cho Quan Ly / Admin (Xem bang luong, day GitHub)
Name: "{autodesktop}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsAdminInstall
Name: "{group}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsAdminInstall
Name: "{group}\Day Ban Cap Nhat Len GitHub"; Filename: "{app}\Day-Len-GitHub.bat"; WorkingDir: "{app}"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsAdminInstall

; Tien ich chung
Name: "{group}\Huong Dan Su Dung (PDF)"; Filename: "{app}\public\Huong_Dan_Su_Dung_Kyodo_Food_Nhan_Vien.pdf"
Name: "{group}\Cap Nhat Phan Mem Tu GitHub"; Filename: "{app}\Cap-Nhat-Phan-Mem.bat"; WorkingDir: "{app}"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Go cai dat Kyodo Food"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\KyodoFood-NhanVien.vbs"; Description: "Khoi chay Kyodo Food - Nhan Vien Cham Cong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent; Check: IsEmployeeInstall
Filename: "{app}\KyodoFood-QuanLy.vbs"; Description: "Khoi chay Kyodo Food - Quan Ly & Bang Luong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent; Check: IsAdminInstall

[Code]
var
  RolePage: TWizardPage;
  CloudPage: TWizardPage;
  RbEmployee: TRadioButton;
  RbAdmin: TRadioButton;
  LblDescEmployee: TLabel;
  LblDescAdmin: TLabel;
  LblPass: TLabel;
  EdtPass: TPasswordEdit;
  IsAdminMode: Boolean;
  
  RbModeCloud: TRadioButton;
  RbModeLocal: TRadioButton;
  LblCloudUrl: TLabel;
  EdtCloudUrl: TEdit;
  LblCloudTip1: TLabel;
  LblCloudTip2: TLabel;

procedure RoleChange(Sender: TObject);
begin
  if RbAdmin.Checked then
  begin
    LblPass.Enabled := True;
    EdtPass.Enabled := True;
    EdtPass.Color := clWindow;
  end
  else
  begin
    LblPass.Enabled := False;
    EdtPass.Enabled := False;
    EdtPass.Color := clBtnFace;
    EdtPass.Text := '';
  end;
end;

procedure CloudModeChange(Sender: TObject);
begin
  if RbModeCloud.Checked then
  begin
    LblCloudUrl.Enabled := True;
    EdtCloudUrl.Enabled := True;
    EdtCloudUrl.Color := clWindow;
  end
  else
  begin
    LblCloudUrl.Enabled := False;
    EdtCloudUrl.Enabled := False;
    EdtCloudUrl.Color := clBtnFace;
  end;
end;

procedure InitializeWizard;
begin
  // Trang 1: Lua chon quyen han (wpSelectDir da hien thi truoc do)
  RolePage := CreateCustomPage(wpSelectDir,
    'Lua Chon Quyen Su Dung Kyodo Food',
    'Vui long chon loai may tinh va quyen han cai dat tren thiet bi nay:');

  // 1. Tuy chon Nhan Vien
  RbEmployee := TRadioButton.Create(RolePage);
  RbEmployee.Parent := RolePage.Surface;
  RbEmployee.Top := ScaleY(10);
  RbEmployee.Left := ScaleX(15);
  RbEmployee.Width := ScaleX(430);
  RbEmployee.Height := ScaleY(22);
  RbEmployee.Caption := '1. Cai dat danh cho NHAN VIEN (May tinh quan Trung Nu Vuong, Da Nang)';
  RbEmployee.Font.Style := [fsBold];
  RbEmployee.Checked := True;
  RbEmployee.OnClick := @RoleChange;

  LblDescEmployee := TLabel.Create(RolePage);
  LblDescEmployee.Parent := RolePage.Surface;
  LblDescEmployee.Top := ScaleY(34);
  LblDescEmployee.Left := ScaleX(35);
  LblDescEmployee.Width := ScaleX(410);
  LblDescEmployee.Caption := 'Tao bieu tuong "Kyodo Food - Nhan Vien" de nhan vien dang nhap cham cong hang ngay.' #13#10 '-> Khong can mat khau khi cai dat.';
  LblDescEmployee.Font.Color := clGray;

  // 2. Tuy chon Quan Ly / Admin
  RbAdmin := TRadioButton.Create(RolePage);
  RbAdmin.Parent := RolePage.Surface;
  RbAdmin.Top := ScaleY(85);
  RbAdmin.Left := ScaleX(15);
  RbAdmin.Width := ScaleX(430);
  RbAdmin.Height := ScaleY(22);
  RbAdmin.Caption := '2. Cai dat quyen QUAN LY / ADMIN (Chu cua hang tai Nghe An)';
  RbAdmin.Font.Style := [fsBold];
  RbAdmin.OnClick := @RoleChange;

  LblDescAdmin := TLabel.Create(RolePage);
  LblDescAdmin.Parent := RolePage.Surface;
  LblDescAdmin.Top := ScaleY(109);
  LblDescAdmin.Left := ScaleX(35);
  LblDescAdmin.Width := ScaleX(410);
  LblDescAdmin.Caption := 'Tao bieu tuong "Kyodo Food - Quan Ly" danh cho Chu cua hang xem bang luong va quan ly.' #13#10 '-> YEU CAU NHAP DUNG MAT KHAU QUAN TRI (ADMIN) DE TIEP TUC.';
  LblDescAdmin.Font.Color := clGray;

  // Truong nhap mat khau
  LblPass := TLabel.Create(RolePage);
  LblPass.Parent := RolePage.Surface;
  LblPass.Top := ScaleY(165);
  LblPass.Left := ScaleX(35);
  LblPass.Caption := 'Nhap mat khau xac nhan quyen Admin (Chu cua hang):';
  LblPass.Font.Style := [fsBold];
  LblPass.Enabled := False;

  EdtPass := TPasswordEdit.Create(RolePage);
  EdtPass.Parent := RolePage.Surface;
  EdtPass.Top := ScaleY(185);
  EdtPass.Left := ScaleX(35);
  EdtPass.Width := ScaleX(220);
  EdtPass.Enabled := False;
  EdtPass.Color := clBtnFace;

  // Trang 2: Cau hinh Cloud / Localhost
  CloudPage := CreateCustomPage(RolePage.ID,
    'Cau Hinh May Chu Kyodo Food (Da Nang - Nghe An)',
    'Chon phuong thuc chay may chu:');

  // Option 1: Cloud (Khuyen dung - Dong bo Da Nang va Nghe An 24/7)
  RbModeCloud := TRadioButton.Create(CloudPage);
  RbModeCloud.Parent := CloudPage.Surface;
  RbModeCloud.Top := ScaleY(10);
  RbModeCloud.Left := ScaleX(15);
  RbModeCloud.Width := ScaleX(430);
  RbModeCloud.Height := ScaleY(22);
  RbModeCloud.Caption := '1. Ket noi truc tiep he thong CLOUD (KHUYEN DUNG - DONG BO 24/7)';
  RbModeCloud.Font.Style := [fsBold];
  RbModeCloud.Checked := True;
  RbModeCloud.OnClick := @CloudModeChange;

  LblCloudUrl := TLabel.Create(CloudPage);
  LblCloudUrl.Parent := CloudPage.Surface;
  LblCloudUrl.Top := ScaleY(34);
  LblCloudUrl.Left := ScaleX(35);
  LblCloudUrl.Caption := 'Duong dan Cloud Server (Render):';
  LblCloudUrl.Enabled := True;

  EdtCloudUrl := TEdit.Create(CloudPage);
  EdtCloudUrl.Parent := CloudPage.Surface;
  EdtCloudUrl.Top := ScaleY(52);
  EdtCloudUrl.Left := ScaleX(35);
  EdtCloudUrl.Width := ScaleX(390);
  EdtCloudUrl.Text := 'https://kyodo-food-attendance-2.onrender.com';
  EdtCloudUrl.Enabled := True;
  EdtCloudUrl.Color := clWindow;

  LblCloudTip1 := TLabel.Create(CloudPage);
  LblCloudTip1.Parent := CloudPage.Surface;
  LblCloudTip1.Top := ScaleY(78);
  LblCloudTip1.Left := ScaleX(35);
  LblCloudTip1.Width := ScaleX(410);
  LblCloudTip1.Caption := 'Dong bo du lieu cham cong va quan ly tuc thi giua Da Nang va Nghe An.' #13#10 'Hoat dong 24/7, khong lo tat may hay lech du lieu.';
  LblCloudTip1.Font.Color := clGray;

  // Option 2: Localhost
  RbModeLocal := TRadioButton.Create(CloudPage);
  RbModeLocal.Parent := CloudPage.Surface;
  RbModeLocal.Top := ScaleY(120);
  RbModeLocal.Left := ScaleX(15);
  RbModeLocal.Width := ScaleX(430);
  RbModeLocal.Height := ScaleY(22);
  RbModeLocal.Caption := '2. Chay may chu cuc bo noi bo (Localhost:5000 - Khong can Internet)';
  RbModeLocal.Font.Style := [fsBold];
  RbModeLocal.Checked := False;
  RbModeLocal.OnClick := @CloudModeChange;

  LblCloudTip2 := TLabel.Create(CloudPage);
  LblCloudTip2.Parent := CloudPage.Surface;
  LblCloudTip2.Top := ScaleY(144);
  LblCloudTip2.Left := ScaleX(35);
  LblCloudTip2.Width := ScaleX(410);
  LblCloudTip2.Caption := 'Chi luu tru du lieu tren may tinh nay (khong dong bo sang may tinh khac).';
  LblCloudTip2.Font.Color := clGray;
  LblCloudTip2.Font.Color := clGray;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = RolePage.ID then
  begin
    if RbAdmin.Checked then
    begin
      if Trim(EdtPass.Text) <> '20162020' then
      begin
        MsgBox('MAT KHAU QUAN TRI KHONG CHINH XAC!' #13#10#13#10 'Ban da chon cai dat quyen Quan Ly / Admin.' #13#10 'Vui long nhap dung mat khau quan tri (Admin) de tiep tuc cai dat phien ban nay.', mbError, MB_OK);
        Result := False;
        Exit;
      end;
      IsAdminMode := True;
    end
    else
    begin
      IsAdminMode := False;
    end;
  end;
end;

function GetRoleName: String;
begin
  if IsAdminMode then
    Result := 'admin'
  else
    Result := 'employee';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigFile: String;
  ConfigContent: String;
  TargetCloudUrl: String;
begin
  if CurStep = ssPostInstall then
  begin
    ConfigFile := ExpandConstant('{app}\cloud_config.json');
    if RbModeCloud.Checked then
    begin
      TargetCloudUrl := Trim(EdtCloudUrl.Text);
      if TargetCloudUrl = '' then
        TargetCloudUrl := 'https://kyodo-food-attendance.onrender.com';
      ConfigContent := '{' #13#10 +
        '  "cloudUrl": "' + TargetCloudUrl + '",' #13#10 +
        '  "activeMode": "cloud",' #13#10 +
        '  "installedRole": "' + GetRoleName() + '"' #13#10 +
        '}';
    end
    else
    begin
      ConfigContent := '{' #13#10 +
        '  "cloudUrl": "",' #13#10 +
        '  "activeMode": "local",' #13#10 +
        '  "installedRole": "' + GetRoleName() + '"' #13#10 +
        '}';
    end;
    SaveStringToFile(ConfigFile, ConfigContent, False);
  end;
end;

function IsEmployeeInstall: Boolean;
begin
  Result := not IsAdminMode;
end;

function IsAdminInstall: Boolean;
begin
  Result := IsAdminMode;
end;
