# JHX Digital Shop - Android Setup & APK Build Guide
## (एंड्रॉयड ऐप सेटअप और APK बनाने का आसान तरीका)

इस प्रोजेक्ट को आप दो तरीकों से एंड्रॉयड में चला सकते हैं:

---

### तरीका 1: 1-क्लिक डायरेक्ट एंड्रॉयड इंस्टॉल (PWA / WebAPK) - *बिना किसी कंप्यूटर के*
1. अपने Android फोन में **Google Chrome** खोलें।
2. इस ऐप का लिंक खोलें:  
   `https://ais-dev-cxqa6wc3bmaxvk4wji3ka2-941055579571.asia-southeast1.run.app`
3. स्क्रीन के ऊपर दिए गए **"Install Android App"** या Chrome के **3 Dots (⋮) > Add to Home screen / Install app** पर टैप करें।
4. ऐप आपके फोन के होम स्क्रीन और ऐप ड्रॉअर में बिना प्ले स्टोर के फुल-स्क्रीन नेटिव ऐप की तरह इंस्टॉल हो जाएगा!
5. इसमें ऑफलाइन सपोर्ट, पुश नोटिफिकेशन और फास्ट कैशिंग शामिल है।

---

### तरीका 2: Android Studio से ओरिजिनल APK या AAB (Play Store) फाइल बनाना
अगर आप अपने क्लाइंट या प्ले स्टोर के लिए `.apk` या `.aab` फाइल बनाना चाहते हैं:

#### जरूरी चीजें:
- [Android Studio Iguana / Jellyfish या नया वर्जन](https://developer.android.com/studio)
- JDK 17

#### स्टेप्स:
1. Android Studio खोलें और **"Open"** पर क्लिक करके `/android` फोल्डर को सेलेक्ट करें।
2. Gradle Sync अपने आप शुरू होगा (1-2 मिनट रुकें)।
3. अगर आप अपनी खुद की लाइव वेबसाइट या डोमेन डालना चाहते हैं, तो:
   - खोलें: `app/src/main/java/com/jhx/digitalshop/MainActivity.kt`
   - लाइन 35 पर `private val appUrl = "..."` में अपनी वेबसाइट का URL बदल दें।
4. **APK जनरेट करने के लिए**:
   - टॉप मेनू में जाएँ: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - कुछ ही सेकंड में आपको `app-debug.apk` मिल जाएगी जिसे आप किसी भी Android फोन में भेजकर इंस्टॉल कर सकते हैं!
5. **Play Store रिलीज के लिए**:
   - मेनू में जाएँ: **Build > Generate Signed Bundle / APK...**
   - **Android App Bundle (.aab)** चुनें और अपनी KeyStore से साइन करें।

---

### मुख्य फीचर्स (Android Shell):
- **WebView Cache & Performance**: सुपर फास्ट पेज लोडिंग
- **Swipe-to-Refresh**: नीचे खींचकर पेज रीलोड करें
- **File Upload & Camera**: फॉर्म या रिव्यू में फोटो अपलोड करने की पूरी सुविधा
- **Back Button Navigation**: एंड्रॉयड का बैक बटन दबाने पर पिछले पेज पर जाएगा, ऐप एकदम से बंद नहीं होगा
- **Download Manager**: डिजिटल प्रोडक्ट्स (ZIP, PDF, Source code) फोन के Downloads फोल्डर में अपने आप डाउनलोड होंगे
- **JavaScript Bridge**: वेब ऐप से एंड्रॉयड वाइब्रेशन और नेटिव शेयर शीट का सीधा कनेक्शन
