Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Thiet lap Working Directory ve thu muc phan mem
WshShell.CurrentDirectory = strDir

' ==============================================================================
' 1. KIEM TRA VA KICH HOAT CUA SO DA TON TAI (SINGLE-INSTANCE: CHI MO 1 CUA SO DUY NHAT)
' ==============================================================================
If WshShell.AppActivate("Kyodo Food App") Then
    WScript.Sleep 50
    WshShell.SendKeys "% r"
    WScript.Quit
End If
If WshShell.AppActivate("Kyodo Food") Then
    WScript.Sleep 50
    WshShell.SendKeys "% r"
    WScript.Quit
End If

focusExe = strDir & "\bin\FocusApp.exe"
If fso.FileExists(focusExe) Then
    ret = WshShell.Run(Chr(34) & focusExe & Chr(34), 0, True)
    If ret = 0 Then
        WScript.Quit
    End If
End If

' ==============================================================================
' 2. XAC DINH CHE DO KET NOI: CLOUD ONLINE HAY LOCALHOST
' ==============================================================================
Function ReadCloudUrl(cfgPath)
    On Error Resume Next
    ReadCloudUrl = ""
    If fso.FileExists(cfgPath) Then
        Dim ts, content, re, matches
        Set ts = fso.OpenTextFile(cfgPath, 1)
        content = ts.ReadAll()
        ts.Close
        
        Set re = New RegExp
        re.Pattern = """cloudUrl""\s*:\s*""([^""]+)"""
        re.IgnoreCase = True
        Set matches = re.Execute(content)
        If matches.Count > 0 Then
            Dim cUrl
            cUrl = Trim(matches(0).SubMatches(0))
            If InStr(cUrl, "http://") = 1 Or InStr(cUrl, "https://") = 1 Then
                If Right(cUrl, 1) = "/" Then cUrl = Left(cUrl, Len(cUrl) - 1)
                ReadCloudUrl = cUrl
            End If
        End If
    End If
    Err.Clear
End Function

Function CheckServer(url)
    On Error Resume Next
    Dim http
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If http Is Nothing Then Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    http.open "GET", url, False
    http.setTimeouts 800, 800, 800, 800
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
cloudUrl = ReadCloudUrl(cfgFile)

Dim appUrl
If Len(cloudUrl) > 5 Then
    ' Che do Cloud Online: Ket noi truc tiep Cloud
    appUrl = cloudUrl
Else
    ' Che do Localhost noi bo
    localCheckUrl = "http://localhost:5000/api/settings"
    appUrl = "http://localhost:5000"
    
    If Not CheckServer(localCheckUrl) Then
        nodeExe = strDir & "\bin\node.exe"
        serverJs = strDir & "\server\server.js"
        
        If fso.FileExists(nodeExe) And fso.FileExists(serverJs) Then
            strCmd = Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverJs & Chr(34)
            WshShell.Run strCmd, 0, False
            
            ' Cho may chu san sang (toi da 20 giay, kiem tra moi 300ms)
            Dim isReady, retryCount
            isReady = False
            For retryCount = 1 To 60
                WScript.Sleep 300
                If CheckServer(localCheckUrl) Then
                    isReady = True
                    Exit For
                End If
            Next
            
            If Not isReady Then
                MsgBox "May chu Kyodo Food noi bo (port 5000) dang mat nhieu thoi gian khoi dong hoac bi Firewall chan." & vbCrLf & vbCrLf & "Phan mem van se mo trinh duyet, hoac ban co the su dung che do Cloud de dong bo giua Da Nang va Nghe An.", 48, "Thong Bao May Chu - Kyodo Food"
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
