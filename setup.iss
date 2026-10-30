; =====================================================================
; KYODO FOOD - TRƯNG NỮ VƯƠNG, ĐÀ NẴNG
; BỘ CÀI ĐẶT DUY NHẤT (SINGLE INSTALLER) VỚI LỰA CHỌN QUYỀN VÀ MẬT KHẨU ADMIN
; =====================================================================

#define MyAppName "Kyodo Food"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Kyodo Food - Trưng Nữ Vương"
#define MyAppURL "https://github.com/MrSand1981/kyodo-food-attendance"

[Setup]
AppId={{D4E723B1-998C-4B11-857A-7928E43B3301}
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
; Shortcut danh cho Nhan Vien (Khong hien thi muc luong)
Name: "{autodesktop}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsEmployeeInstall
Name: "{group}\Kyodo Food - Nhan Vien Cham Cong"; Filename: "{app}\KyodoFood-NhanVien.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsEmployeeInstall

; Shortcut danh cho Quan Ly / Admin (Xem bang luong, day GitHub)
Name: "{autodesktop}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsAdminInstall
Name: "{group}\Kyodo Food - Quan Ly & Bang Luong"; Filename: "{app}\KyodoFood-QuanLy.vbs"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsAdminInstall
Name: "{group}\Day Ban Cap Nhat Len GitHub"; Filename: "{app}\Day-Len-GitHub.bat"; IconFilename: "{app}\kyodo-icon.ico"; Check: IsAdminInstall

; Tien ich chung
Name: "{group}\Cap Nhat Phan Mem Tu GitHub"; Filename: "{app}\Cap-Nhat-Phan-Mem.bat"; IconFilename: "{app}\kyodo-icon.ico"
Name: "{group}\Go cai dat Kyodo Food"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\KyodoFood-NhanVien.vbs"; Description: "Khoi chay Kyodo Food - Nhan Vien Cham Cong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent; Check: IsEmployeeInstall
Filename: "{app}\KyodoFood-QuanLy.vbs"; Description: "Khoi chay Kyodo Food - Quan Ly & Bang Luong ngay bay gio"; Flags: shellexec postinstall nowait skipifsilent; Check: IsAdminInstall

[Code]
var
  RolePage: TWizardPage;
  RbEmployee: TRadioButton;
  RbAdmin: TRadioButton;
  LblDescEmployee: TLabel;
  LblDescAdmin: TLabel;
  LblPass: TLabel;
  EdtPass: TPasswordEdit;
  IsAdminMode: Boolean;

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

procedure InitializeWizard;
begin
  RolePage := CreateCustomPage(wpSelectDir,
    'Lua Chon Quyen Su Dung Kyodo Food',
    'Vui long chon loai may tinh va quyen han cai dat tren thiet bi nay:');

  // 1. Tùy chọn Nhân Viên
  RbEmployee := TRadioButton.Create(RolePage);
  RbEmployee.Parent := RolePage.Surface;
  RbEmployee.Top := ScaleY(12);
  RbEmployee.Left := ScaleX(15);
  RbEmployee.Width := ScaleX(420);
  RbEmployee.Height := ScaleY(22);
  RbEmployee.Caption := '1. Cai dat danh cho NHAN VIEN (May tinh quan Trung Nu Vuong, Da Nang)';
  RbEmployee.Font.Style := [fsBold];
  RbEmployee.Checked := True;
  RbEmployee.OnClick := @RoleChange;

  LblDescEmployee := TLabel.Create(RolePage);
  LblDescEmployee.Parent := RolePage.Surface;
  LblDescEmployee.Top := ScaleY(38);
  LblDescEmployee.Left := ScaleX(35);
  LblDescEmployee.Width := ScaleX(400);
  LblDescEmployee.Caption := 'Tao bieu tuong "Kyodo Food - Nhan Vien" ngoai Desktop de nhan vien dang nhap cham cong hang ngay.' #13#10 '-> Khong can mat khau khi cai dat.';
  LblDescEmployee.Font.Color := clGray;

  // 2. Tùy chọn Quản Lý / Admin
  RbAdmin := TRadioButton.Create(RolePage);
  RbAdmin.Parent := RolePage.Surface;
  RbAdmin.Top := ScaleY(100);
  RbAdmin.Left := ScaleX(15);
  RbAdmin.Width := ScaleX(420);
  RbAdmin.Height := ScaleY(22);
  RbAdmin.Caption := '2. Cai dat quyen QUAN LY / ADMIN (Chu cua hang tai Nghe An)';
  RbAdmin.Font.Style := [fsBold];
  RbAdmin.OnClick := @RoleChange;

  LblDescAdmin := TLabel.Create(RolePage);
  LblDescAdmin.Parent := RolePage.Surface;
  LblDescAdmin.Top := ScaleY(126);
  LblDescAdmin.Left := ScaleX(35);
  LblDescAdmin.Width := ScaleX(400);
  LblDescAdmin.Caption := 'Tao bieu tuong "Kyodo Food - Quan Ly" ngoai Desktop danh cho Chu cua hang.' #13#10 '-> YEU CAU NHAP DUNG MAT KHAU QUAN TRI (ADMIN) DE TIEP TUC.';
  LblDescAdmin.Font.Color := clGray;

  // Trường nhập mật khẩu
  LblPass := TLabel.Create(RolePage);
  LblPass.Parent := RolePage.Surface;
  LblPass.Top := ScaleY(190);
  LblPass.Left := ScaleX(35);
  LblPass.Caption := 'Nhap mat khau xac nhan quyen Admin (Chu cua hang):';
  LblPass.Font.Style := [fsBold];
  LblPass.Enabled := False;

  EdtPass := TPasswordEdit.Create(RolePage);
  EdtPass.Parent := RolePage.Surface;
  EdtPass.Top := ScaleY(210);
  EdtPass.Left := ScaleX(35);
  EdtPass.Width := ScaleX(220);
  EdtPass.Enabled := False;
  EdtPass.Color := clBtnFace;
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

function IsEmployeeInstall: Boolean;
begin
  Result := not IsAdminMode;
end;

function IsAdminInstall: Boolean;
begin
  Result := IsAdminMode;
end;
