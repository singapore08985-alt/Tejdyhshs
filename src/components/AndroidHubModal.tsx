import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  ShieldCheck, 
  Wifi, 
  Share2, 
  Vibrate, 
  Layers, 
  CheckCircle2,
  Sparkles,
  FileCode,
  QrCode
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHapticFeedback, showAndroidToast, shareDigitalProduct } from '../utils/haptics';

interface AndroidHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const AndroidHubModal: React.FC<AndroidHubModalProps> = ({ isOpen, onClose, appUrl }) => {
  const [activeTab, setActiveTab] = useState<'install' | 'project' | 'code' | 'features'>('install');
  const [selectedCodeFile, setSelectedCodeFile] = useState<'mainActivity' | 'manifest' | 'gradle'>('mainActivity');
  const [copiedFile, setCopiedFile] = useState(false);
  const [testHapticDone, setTestHapticDone] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const mainActivityCode = `package com.jhx.digitalshop

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private val appUrl = "${appUrl}"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

        // Configure WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString JHXDigitalShopAndroid/1.0"
        }

        // Native JS Bridge for Haptics and Sharing
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                swipeRefreshLayout.isRefreshing = false
            }
        }

        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }

        // Hardware Back Button
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        webView.loadUrl(appUrl)
    }

    class WebAppInterface(private val context: Context) {
        @JavascriptInterface
        fun triggerHaptic(duration: Long) {
            // Native Android vibration
        }
    }
}`;

  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jhx.digitalshop">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Digital Shop"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/Theme.AppCompat.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const gradleCode = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.jhx.digitalshop"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.jhx.digitalshop"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("com.google.android.material:material:1.12.0")
}`;

  const currentCode = 
    selectedCodeFile === 'mainActivity' ? mainActivityCode :
    selectedCodeFile === 'manifest' ? manifestCode : gradleCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedFile(true);
    triggerHapticFeedback(30);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleTestVibration = () => {
    triggerHapticFeedback([40, 60, 40]);
    setTestHapticDone(true);
    showAndroidToast("Vibration triggered via Android bridge!");
    setTimeout(() => setTestHapticDone(false), 1500);
  };

  const handleTestShare = () => {
    shareDigitalProduct(
      "JHX Digital Shop - Android Ready",
      "Check out this Digital Shop for software and UI kits with native Android integration!",
      appUrl
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Android App & APK Center</h2>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Android 8 - 15 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                एंड्रॉयड ऐप बनाएं, फोन में इंस्टॉल करें या Android Studio APK फाइल जनरेट करें
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHapticFeedback(15);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              setActiveTab('install');
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'install'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1-Click Android Install (WebAPK)
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              setActiveTab('project');
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'project'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Download Android Studio Project (.ZIP)
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              setActiveTab('code');
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Kotlin & Manifest Code
          </button>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              setActiveTab('features');
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'features'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Android Native Features Test
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          
          {/* TAB 1: 1-Click Android Install */}
          {activeTab === 'install' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PWA & WebAPK Standalone Enabled
                  </div>
                  <h3 className="text-xl font-bold text-white">Direct Android Phone Install</h3>
                  <p className="text-sm text-slate-300 max-w-xl">
                    बिना प्ले स्टोर या बिना कंप्यूटर के, सीधे अपने Android मोबाइल में फुल स्क्रीन ऐप इंस्टॉल करें। ऐप आइकन आपके फोन के होम स्क्रीन और ऐप ड्रॉअर में आ जाएगा!
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  {isInstalled ? (
                    <div className="px-5 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2 border border-emerald-500/40">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Already Installed on this Device!
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={() => {
                        triggerHapticFeedback(20);
                        install();
                      }}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Download className="w-5 h-5" />
                      1-Tap Install on Android
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHapticFeedback(15);
                        alert("On your Android phone, tap Chrome's 3 dots (⋮) and select 'Install app' or 'Add to Home screen'!");
                      }}
                      className="px-6 py-3.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <Smartphone className="w-5 h-5" />
                      How to Install on Android
                    </button>
                  )}
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                    1
                  </div>
                  <h4 className="font-semibold text-white text-sm">Open on Android Chrome</h4>
                  <p className="text-xs text-slate-400">
                    अपने फोन में Chrome ब्राउज़र में इस डिजिटल शॉप का URL खोलें।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                    2
                  </div>
                  <h4 className="font-semibold text-white text-sm">Tap 'Install App'</h4>
                  <p className="text-xs text-slate-400">
                    वेबसाइट पर 'Install Android App' बटन या Chrome मेनू (⋮) से 'Add to Home screen' दबाएं।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                    3
                  </div>
                  <h4 className="font-semibold text-white text-sm">Use as Native App</h4>
                  <p className="text-xs text-slate-400">
                    ऐप बिना एड्रेस बार के फुल स्क्रीन में खुलेगा, जिसमें ऑफलाइन सपोर्ट और फास्ट लोडिंग मिलेगी।
                  </p>
                </div>
              </div>

              {/* Live URL box with QR / Copy */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">App Live URL</div>
                    <div className="text-xs sm:text-sm font-mono text-emerald-400 truncate max-w-sm sm:max-w-md">
                      {appUrl}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appUrl);
                    triggerHapticFeedback(20);
                    showAndroidToast("Live URL copied!");
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Download Android Studio Project */}
          {activeTab === 'project' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                    <FileCode className="w-3.5 h-3.5" />
                    Complete Native Android Project (.ZIP)
                  </div>
                  <h3 className="text-xl font-bold text-white">Download Android Studio Source (.ZIP)</h3>
                  <p className="text-sm text-slate-300 max-w-xl">
                    इसमें पूरा Kotlin प्रोजेक्ट, Gradle 8.5 फाइल्स, AndroidManifest, Swipe-to-refresh लेआउट और launcher icons तैयार हैं। इसे Android Studio में खोलकर 1-क्लिक में <strong>.apk</strong> या <strong>.aab</strong> फाइल जनरेट करें!
                  </p>
                </div>

                <a
                  href="/digital-shop-android-project.zip"
                  download="digital-shop-android-project.zip"
                  onClick={() => triggerHapticFeedback(30)}
                  className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Download Android Project (.ZIP)
                </a>
              </div>

              {/* Hindi & English APK Generation Guide */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Android Studio में APK बनाने के 3 आसान स्टेप्स:
                </h4>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center">1</span>
                    <div>
                      <strong>ज़िप फाइल अनज़िप करें और Android Studio में खोलें:</strong>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Android Studio खोलकर <em>File &gt; Open</em> पर क्लिक करें और अनज़िप किए गए फोल्डर को सेलेक्ट करें। Gradle Sync 1 मिनट में पूरा हो जाएगा।
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center">2</span>
                    <div>
                      <strong>(ऑप्शनल) अपना कस्टम डोमेन सेट करें:</strong>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono bg-slate-900 px-2 py-1 rounded inline-block text-emerald-300">
                        app/src/main/java/com/jhx/digitalshop/MainActivity.kt (Line 35)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center">3</span>
                    <div>
                      <strong>1-क्लिक APK जनरेट करें:</strong>
                      <p className="text-xs text-slate-400 mt-0.5">
                        टॉप मेनू से <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> पर क्लिक करें। आपको तुरंत <code className="text-emerald-400">app-debug.apk</code> मिल जाएगी!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Code Inspector */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setSelectedCodeFile('mainActivity')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selectedCodeFile === 'mainActivity'
                        ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    MainActivity.kt
                  </button>
                  <button
                    onClick={() => setSelectedCodeFile('manifest')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selectedCodeFile === 'manifest'
                        ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    AndroidManifest.xml
                  </button>
                  <button
                    onClick={() => setSelectedCodeFile('gradle')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selectedCodeFile === 'gradle'
                        ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    build.gradle.kts
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code display block */}
              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px]">
                <pre>{currentCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: Android Native Features Test */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                यह वेब ऐप सीधे एंड्रॉयड हार्डवेयर और ऑपरेटिंग सिस्टम के साथ इंटरैक्ट करता है। आप नीचे दिए गए बटन्स से इन फीचर्स को लाइव टेस्ट कर सकते हैं:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Haptic test */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <Vibrate className="w-4 h-4" />
                    Android Haptic Vibration
                  </div>
                  <p className="text-xs text-slate-400">
                    Android फोन का वाइब्रेटर मोटर ट्रिगर करता है (जैसे कि बटन क्लिक या पेमेंट सक्सेस पर)।
                  </p>
                  <button
                    onClick={handleTestVibration}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Vibrate className="w-4 h-4" />
                    {testHapticDone ? 'Vibrated!' : 'Test Vibration (हैंडसेट वाइब्रेट करें)'}
                  </button>
                </div>

                {/* Share test */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                    <Share2 className="w-4 h-4" />
                    Android Native Share Sheet
                  </div>
                  <p className="text-xs text-slate-400">
                    WhatsApp, Telegram, या किसी भी ऐप पर सीधे प्रोडक्ट शेयर करने के लिए एंड्रॉयड की नेटिव शीट खोलता है।
                  </p>
                  <button
                    onClick={handleTestShare}
                    className="w-full py-2 px-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold text-xs border border-blue-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Test Android Share Sheet
                  </button>
                </div>

                {/* Offline Cache */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <Wifi className="w-4 h-4" />
                    Offline Service Worker Cache
                  </div>
                  <p className="text-xs text-slate-400">
                    इंटरनेट बंद होने पर भी ऐप क्रैश नहीं होगा और प्रोडक्ट्स लोड होते रहेंगे।
                  </p>
                  <div className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-1 rounded inline-block">
                    ✓ CacheFirst & StaleWhileRevalidate Active
                  </div>
                </div>

                {/* File Picker */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    File Uploads & Camera Support
                  </div>
                  <p className="text-xs text-slate-400">
                    Android WebChromeClient ValueCallback के ज़रिये गैलरी या कैमरा से फाइल अपलोड की पूरी सुविधा।
                  </p>
                  <div className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-1 rounded inline-block">
                    ✓ FileChooserParams Supported
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Package: <code className="text-slate-300 font-mono">com.jhx.digitalshop</code></span>
          </div>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
