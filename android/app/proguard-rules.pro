# ProGuard rules for Kyodo Food Android App
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.kyodofood.attendance.MainActivity$* {
    *;
}
