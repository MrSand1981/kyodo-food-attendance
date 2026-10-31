Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' ==============================================================================
' 1. KIEM TRA VA KICH HOAT CUA SO DA TON TAI (SINGLE-INSTANCE: CHI MO 1 CUA SO DUY NHAT)
' ==============================================================================
' Buoc 1A: Kich hoat tuc thi bang AppActivate (1 millisecond)
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

' Buoc 1B: Su dung FocusApp.exe (Win32 API khoi phuc cua so ke ca khi dang Minimize)
focusExe = strDir & "\bin\FocusApp.exe"
If fso.FileExists(focusExe) Then
    ret = WshShell.Run(Chr(34) & focusExe & Chr(34), 0, True)
    If ret = 0 Then
        WScript.Quit
    End If
End If

' ==============================================================================
' 2. NEU CHUA CO CUA SO NAO: KHOI DONG SERVER NODE.JS VA MO 1 CUA SO DUY NHAT
' ==============================================================================
strCmd = Chr(34) & strDir & "\bin\node.exe" & Chr(34) & " " & Chr(34) & strDir & "\server\server.js" & Chr(34)
WshShell.Run strCmd, 0, False

WScript.Sleep 1200

appUrl = "http://localhost:5000"
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
