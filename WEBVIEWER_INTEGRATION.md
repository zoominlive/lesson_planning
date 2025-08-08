# Tablet WebViewer Integration Guide

## Overview
The tablet-optimized version of the Lesson Planning Studio is available at `/tablet` route and is specifically designed for embedding in Android and iOS apps using WebView components.

## Access URLs

### For Development
- **Regular Web Version**: `http://localhost:5000/`
- **Tablet-Optimized Version**: `http://localhost:5000/tablet`

### For Production
- **Regular Web Version**: `https://your-domain.replit.app/`
- **Tablet-Optimized Version**: `https://your-domain.replit.app/tablet`

## Features of Tablet Version

### Touch-Optimized Interface
- Large touch targets (minimum 44x44px)
- Touch-friendly gestures
- No hover states on mobile
- Optimized scrolling performance

### Mobile-Specific UI
- Compact header with week navigation
- Bottom drawer for activity selection
- Grid-based calendar optimized for tablet screens
- Responsive layout for portrait and landscape

### Performance Optimizations
- Reduced animations on touch devices
- Optimized for WebView rendering
- Minimal resource usage

## Android Integration

### WebView Setup
```java
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();

// Enable JavaScript
webSettings.setJavaScriptEnabled(true);

// Enable DOM storage
webSettings.setDomStorageEnabled(true);

// Enable responsive viewport
webSettings.setUseWideViewPort(true);
webSettings.setLoadWithOverviewMode(true);

// Set user agent to identify mobile app
webSettings.setUserAgentString(webSettings.getUserAgentString() + " LessonPlannerApp/1.0");

// Load the tablet version
webView.loadUrl("https://your-domain.replit.app/tablet");
```

### Passing Authentication Token
```java
// Method 1: URL Parameter
String token = getAuthToken();
String url = "https://your-domain.replit.app/tablet?token=" + token;
webView.loadUrl(url);

// Method 2: JavaScript Interface
webView.evaluateJavascript(
    "window.postMessage({type: 'AUTH_TOKEN', token: '" + token + "'}, '*');",
    null
);
```

## iOS Integration

### WKWebView Setup
```swift
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure WebView
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        
        // Create WebView
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.scrollView.bounces = false
        
        // Respect safe areas
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        
        view.addSubview(webView)
        
        // Load tablet version
        if let url = URL(string: "https://your-domain.replit.app/tablet") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
}
```

### Passing Authentication Token
```swift
// Method 1: URL Parameter
let token = getAuthToken()
let urlString = "https://your-domain.replit.app/tablet?token=\(token)"
if let url = URL(string: urlString) {
    let request = URLRequest(url: url)
    webView.load(request)
}

// Method 2: JavaScript Evaluation
let token = getAuthToken()
let javascript = "window.postMessage({type: 'AUTH_TOKEN', token: '\(token)'}, '*');"
webView.evaluateJavaScript(javascript) { (result, error) in
    if let error = error {
        print("JavaScript error: \(error)")
    }
}
```

## Flutter Integration

```dart
import 'package:webview_flutter/webview_flutter.dart';

class LessonPlannerWebView extends StatefulWidget {
  @override
  _LessonPlannerWebViewState createState() => _LessonPlannerWebViewState();
}

class _LessonPlannerWebViewState extends State<LessonPlannerWebView> {
  late WebViewController _controller;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebView(
          initialUrl: 'https://your-domain.replit.app/tablet',
          javascriptMode: JavascriptMode.unrestricted,
          onWebViewCreated: (WebViewController webViewController) {
            _controller = webViewController;
            _passAuthToken();
          },
        ),
      ),
    );
  }
  
  void _passAuthToken() async {
    String token = await getAuthToken();
    _controller.evaluateJavascript(
      "window.postMessage({type: 'AUTH_TOKEN', token: '$token'}, '*');"
    );
  }
}
```

## React Native Integration

```javascript
import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';

const LessonPlannerWebView = ({ authToken }) => {
  const webViewRef = useRef(null);
  
  useEffect(() => {
    if (webViewRef.current && authToken) {
      const message = JSON.stringify({
        type: 'AUTH_TOKEN',
        token: authToken
      });
      webViewRef.current.postMessage(message);
    }
  }, [authToken]);
  
  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://your-domain.replit.app/tablet' }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
    />
  );
};
```

## Authentication Methods

The application supports two methods for passing authentication tokens:

### 1. URL Parameter (Recommended for initial load)
```
https://your-domain.replit.app/tablet?token=YOUR_JWT_TOKEN
```

### 2. PostMessage API (Recommended for token refresh)
```javascript
window.postMessage({
  type: 'AUTH_TOKEN',
  token: 'YOUR_JWT_TOKEN'
}, '*');
```

## Testing the Tablet Version

1. **Desktop Browser Testing**:
   - Open Chrome DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select iPad or tablet preset
   - Navigate to `/tablet` route

2. **Real Device Testing**:
   - Deploy to Replit
   - Access from tablet browser
   - Test touch interactions
   - Verify responsive layout

## Viewport Settings

The tablet version includes optimized viewport settings:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

This ensures:
- No pinch-to-zoom
- Full viewport coverage
- Proper handling of device safe areas
- Consistent scaling across devices

## Performance Tips

1. **Preload the WebView**: Initialize WebView on app launch for faster loading
2. **Cache Strategy**: Enable WebView caching for offline support
3. **Token Management**: Store tokens securely and refresh before expiration
4. **Error Handling**: Implement retry logic for network failures

## Troubleshooting

### Common Issues

1. **Blank Screen**: 
   - Check JavaScript is enabled
   - Verify URL is accessible
   - Check authentication token validity

2. **Layout Issues**:
   - Ensure viewport meta tag is respected
   - Check WebView size constraints
   - Verify safe area handling

3. **Authentication Failures**:
   - Verify token format and expiration
   - Check CORS settings if applicable
   - Ensure token is properly encoded in URL

## Support

For issues or questions, please check:
- Application logs at `/api/logs`
- Browser console for JavaScript errors
- Network tab for API failures