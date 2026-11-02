Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Thiet lap Working Directory ve thu muc phan mem
WshShell.CurrentDirectory = strDir

' ==============================================================================
' 1. KIEM TRA VA KICH HOAT CUA SO DA TON TAI (SINGLE-INSTANCE: CHI MO 1 CUA SO DUY NHAT)
' ==============================================================================
focusExe = strDir & "\bin\FocusApp.exe"
If fso.FileExists(focusExe) Then
    ret = WshShell.Run(Chr(34) & focusExe & Chr(34), 0, True)
    If ret = 0 Then
        WScript.Quit
    End If
End If

' ==============================================================================
' 2. XAC DINH CHE DO KET NOI: CLOUD ONLINE HAY LOCALHOST (CO HUONG DAN VA HOI THONG MINH)
' ==============================================================================
Function ReadConfigField(cfgPath, fieldName)
    On Error Resume Next
    ReadConfigField = ""
    If fso.FileExists(cfgPath) Then
        Dim ts, content, re, matches
        Set ts = fso.OpenTextFile(cfgPath, 1)
        content = ts.ReadAll()
        ts.Close
        
        Set re = New RegExp
        re.Pattern = """" & fieldName & """\s*:\s*""([^""]+)"""
        re.IgnoreCase = True
        Set matches = re.Execute(content)
        If matches.Count > 0 Then
            ReadConfigField = Trim(matches(0).SubMatches(0))
        End If
    End If
    Err.Clear
End Function

Function CheckServer(url, timeoutMs)
    On Error Resume Next
    Dim http
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If http Is Nothing Then Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    http.open "GET", url, False
    http.setTimeouts timeoutMs, timeoutMs, timeoutMs, timeoutMs
    http.send ""
    If Err.Number = 0 Then
        If http.status = 200 Then
            CheckServer = True
            Exit Function
        End If
    End If
    CheckServer = False
    Err.Clear
End Function

cfgFile = strDir & "\cloud_config.json"
cloudUrl = ReadConfigField(cfgFile, "cloudUrl")
If Right(cloudUrl, 1) = "/" Then cloudUrl = Left(cloudUrl, Len(cloudUrl) - 1)
activeMode = LCase(ReadConfigField(cfgFile, "activeMode"))

Dim appUrl
Dim useCloud
useCloud = False

' Neu duoc cau hinh che do Cloud
If activeMode = "cloud" And Len(cloudUrl) > 7 Then
    cloudHealthUrl = cloudUrl & "/api/ping"
    ' Kiem tra nhanh trong 4 giay xem Cloud co dang san sang khong
    If CheckServer(cloudHealthUrl, 4000) Then
        useCloud = True
        appUrl = cloudUrl & "/?mode=manager"
    Else
        ' Neu Cloud chua phan hoi ngay, hoi nguoi dung
        Dim choice
        choice = MsgBox("May chu Cloud chua phan hoi ngay tai:" & vbCrLf & cloudUrl & vbCrLf & vbCrLf & _
                        "- Neu may chu Cloud Render vua thuc day, se can vai giay de nap." & vbCrLf & _
                        "- Bam [YES] de tiep tuc mo Cloud (giao dien se tu dong ket noi va cho may chu)." & vbCrLf & _
                        "- Bam [NO] de chuyen sang chay May Chu Cuc Bo (Localhost) tren may nay.", _
                        36, "Ket Noi He Thong Kyodo Food - Da Nang & Nghe An")
        If choice = 6 Then ' vbYes
            useCloud = True
            appUrl = cloudUrl & "/?mode=manager"
        Else
            useCloud = False
        End If
    End If
ElseIf Len(cloudUrl) > 7 Then
    cloudHealthUrl = cloudUrl & "/api/ping"
    If CheckServer(cloudHealthUrl, 3000) Then
        useCloud = True
        appUrl = cloudUrl & "/?mode=manager"
    End If
End If

' Neu khong dung Cloud (hoac nguoi dung chon chay Localhost tren may nay)
If Not useCloud Then
    localCheckUrl = "http://localhost:5000/api/settings"
    appUrl = "http://localhost:5000/?mode=manager"
    
    If Not CheckServer(localCheckUrl, 1000) Then
        nodeExe = strDir & "\bin\node.exe"
        serverJs = strDir & "\server\server.js"
        
        If fso.FileExists(nodeExe) And fso.FileExists(serverJs) Then
            strCmd = Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverJs & Chr(34)
            WshShell.Run strCmd, 0, False
            
            ' Cho may chu cuc bo san sang (toi da 20 giay, kiem tra moi 300ms)
            Dim isReady, retryCount
            isReady = False
            For retryCount = 1 To 60
                WScript.Sleep 300
                If CheckServer(localCheckUrl, 1000) Then
                    isReady = True
                    Exit For
                End If
            Next
            
            If Not isReady Then
                MsgBox "May chu Kyodo Food noi bo (port 5000) dang mat nhieu thoi gian khoi dong hoac bi Firewall chan." & vbCrLf & vbCrLf & "Phan mem van se mo trinh duyet de ban kiem tra.", 48, "Thong Bao May Chu - Kyodo Food"
            End If
        Else
            MsgBox "Khong tim thay tap tin khoi dong Node.js tai:" & vbCrLf & nodeExe, 16, "Loi Khoi Dong - Kyodo Food"
            WScript.Quit
        End If
    End If
End If

' ==============================================================================
' 3. MO CUA SO UNG DUNG CHROME / EDGE (STANDALONE WINDOW)
' ==============================================================================
profileDir = WshShell.ExpandEnvironmentStrings("%LocalAppData%\KyodoFood\browser-profile")

chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If Not fso.FileExists(chromePath) Then
    chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If
If Not fso.FileExists(chromePath) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe")
End If

edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
If Not fso.FileExists(edgePath) Then
    edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
End If

If fso.FileExists(chromePath) Then
    WshShell.Run Chr(34) & chromePath & Chr(34) & " --app=" & appUrl & " --user-data-dir=" & Chr(34) & profileDir & Chr(34) & " --start-maximized", 1, False
ElseIf fso.FileExists(edgePath) Then
    WshShell.Run Chr(34) & edgePath & Chr(34) & " --app=" & appUrl & " --user-data-dir=" & Chr(34) & profileDir & Chr(34) & " --start-maximized", 1, False
Else
    WshShell.Run appUrl, 1, False
End If
