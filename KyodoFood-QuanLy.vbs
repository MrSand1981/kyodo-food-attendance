Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Khoi dong may chu Node.js chay ngam neu chua chay
strCmd = Chr(34) & strDir & "\bin\node.exe" & Chr(34) & " " & Chr(34) & strDir & "\server\server.js" & Chr(34)
WshShell.Run strCmd, 0, False

WScript.Sleep 1500

' 2. Mo ung dung che do Quan Ly & Tinh Luong (Mat khau 20162020)
appUrl = "http://localhost:5000/?mode=manager"

edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
If Not fso.FileExists(edgePath) Then
    edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
End If

chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If Not fso.FileExists(chromePath) Then
    chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If
If Not fso.FileExists(chromePath) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe")
End If

If fso.FileExists(edgePath) Then
    WshShell.Run Chr(34) & edgePath & Chr(34) & " --app=" & appUrl, 1, False
ElseIf fso.FileExists(chromePath) Then
    WshShell.Run Chr(34) & chromePath & Chr(34) & " --app=" & appUrl, 1, False
Else
    WshShell.Run appUrl, 1, False
End If
