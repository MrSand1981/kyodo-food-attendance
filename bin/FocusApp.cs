using System;
using System.Text;
using System.Runtime.InteropServices;

namespace KyodoLauncher {
    static class Program {
        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

        [DllImport("user32.dll")]
        static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
        delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        static extern bool CloseDesktop(IntPtr hDesktop);

        [DllImport("user32.dll")]
        static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr ProcessId);

        [DllImport("user32.dll")]
        static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

        [DllImport("kernel32.dll")]
        static extern uint GetCurrentThreadId();

        const int SW_RESTORE = 9;

        static void ForceForeground(IntPtr hWnd) {
            ShowWindowAsync(hWnd, SW_RESTORE);
            IntPtr fgWnd = GetForegroundWindow();
            uint curThread = GetCurrentThreadId();
            uint fgThread = GetWindowThreadProcessId(fgWnd, IntPtr.Zero);
            if (curThread != fgThread && fgThread != 0) {
                AttachThreadInput(curThread, fgThread, true);
                SetForegroundWindow(hWnd);
                BringWindowToTop(hWnd);
                AttachThreadInput(curThread, fgThread, false);
            } else {
                SetForegroundWindow(hWnd);
                BringWindowToTop(hWnd);
            }
        }

        [STAThread]
        static int Main(string[] args) {
            IntPtr hDesk = OpenDesktop("default", 0, false, 0x0100);
            IntPtr targetHwnd = IntPtr.Zero;

            if (hDesk != IntPtr.Zero) {
                EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    string title = sb.ToString();

                    if ((title.IndexOf("Kyodo Food App", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         title.IndexOf("Kyodo Food", StringComparison.OrdinalIgnoreCase) >= 0) &&
                        !title.Contains("PDF") && 
                        !title.Contains("Foxit") && 
                        !title.Contains("Acrobat") &&
                        !title.Contains("Visual Studio") &&
                        !title.Contains("Code")) {
                        targetHwnd = hWnd;
                        return false;
                    }
                    return true;
                }, IntPtr.Zero);
                CloseDesktop(hDesk);
            }

            if (targetHwnd != IntPtr.Zero) {
                ForceForeground(targetHwnd);
                return 0; // Found & focused
            }

            return 1; // Not found
        }
    }
}
