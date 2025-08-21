# WebViewer Technical Integration Guide

## Technical Architecture

### What Makes the `/tablet` Route Special for WebView Integration

The `/tablet` route is specifically engineered for WebView embedding with the following technical optimizations:

#### 1. **Viewport and Touch Optimization**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```
- **Fixed viewport**: Prevents pinch-to-zoom which can break native app UX
- **viewport-fit=cover**: Handles iPhone X+ notches and Android camera cutouts
- **Touch-optimized targets**: Minimum 44x44px hit areas for reliable touch interaction

#### 2. **Memory-Efficient React Components**
- **Lazy-loaded components**: TabletRecordingView and TabletActivityDrawer load on-demand
- **Virtualized lists**: Long activity lists use windowing to minimize DOM nodes
- **Debounced API calls**: Prevents excessive network requests during rapid interactions

#### 3. **WebView-Specific Event Handling**
```javascript
// Prevents rubber-band scrolling on iOS
body {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

// Safe area handling for modern devices
#root {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

#### 4. **Dual Authentication Pattern**
The system supports two JWT delivery methods to ensure compatibility across all WebView implementations:
- **URL Parameter**: Primary method for initial load
- **PostMessage API**: Secondary method for token refresh without page reload

## JWT Authentication Implementation

### Token Structure
```typescript
interface JWTPayload {
  tenantId: string;           // Organization identifier
  userFirstName: string;      // Display name
  userLastName: string;       // Display name
  username: string;           // Unique identifier
  role: 'Admin' | 'Teacher';  // Authorization level
  locations: string[];        // Authorized location names
  iat: number;               // Issued at timestamp
  exp: number;               // Expiration timestamp
}
```

### Token Validation Flow
```javascript
// client/src/lib/auth.ts
export function initializeIframeAuth() {
  // 1. Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    localStorage.setItem('authToken', tokenFromUrl);
    // Clean URL to hide token
    window.history.replaceState({}, '', window.location.pathname);
  }
  
  // 2. Listen for PostMessage
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'AUTH_TOKEN') {
      localStorage.setItem('authToken', event.data.token);
      window.location.reload();
    }
  });
}
```

### Server-Side Validation
```javascript
// server/routes.ts
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.tenantId = decoded.tenantId;
      req.userLocations = decoded.locations;
      req.user = decoded;
    } catch (error) {
      // Token invalid or expired
    }
  }
  next();
});
```

## iOS Integration with JWT

### Swift Implementation
```swift
import WebKit
import CryptoKit

class LessonPlannerWebViewController: UIViewController {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadWebViewWithJWT()
    }
    
    func setupWebView() {
        let configuration = WKWebViewConfiguration()
        
        // Enable JavaScript
        configuration.preferences.javaScriptEnabled = true
        
        // Handle safe areas
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.scrollView.bounces = false
        
        view.addSubview(webView)
    }
    
    func generateJWT() -> String {
        // Your JWT generation logic
        let header = ["alg": "HS256", "typ": "JWT"]
        let payload = [
            "tenantId": "your-tenant-id",
            "userFirstName": getUserFirstName(),
            "userLastName": getUserLastName(),
            "username": getUsername(),
            "role": getUserRole(),
            "locations": getUserLocations(),
            "iat": Int(Date().timeIntervalSince1970),
            "exp": Int(Date().timeIntervalSince1970 + 3600)
        ]
        
        // Sign with your secret (use proper JWT library in production)
        return signJWT(header: header, payload: payload, secret: getJWTSecret())
    }
    
    func loadWebViewWithJWT() {
        let token = generateJWT()
        let urlString = "https://your-domain.replit.app/tablet?token=\(token)"
        
        if let url = URL(string: urlString) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    func refreshToken() {
        let newToken = generateJWT()
        let javascript = """
            window.postMessage({
                type: 'AUTH_TOKEN',
                token: '\(newToken)'
            }, '*');
        """
        webView.evaluateJavaScript(javascript, completionHandler: nil)
    }
}
```

### Token Refresh Strategy (iOS)
```swift
// Set up a timer to refresh token before expiration
Timer.scheduledTimer(withTimeInterval: 3000, repeats: true) { _ in
    self.refreshToken()
}

// Or refresh on app foreground
NotificationCenter.default.addObserver(
    self,
    selector: #selector(refreshToken),
    name: UIApplication.willEnterForegroundNotification,
    object: nil
)
```

## Android Integration with JWT

### Kotlin Implementation
```kotlin
import android.webkit.WebView
import android.webkit.WebSettings
import android.webkit.JavascriptInterface
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import java.util.Date

class LessonPlannerActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_lesson_planner)
        
        setupWebView()
        loadWebViewWithJWT()
    }
    
    private fun setupWebView() {
        webView = findViewById(R.id.webview)
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            
            // Handle viewport
            useWideViewPort = true
            loadWithOverviewMode = true
            
            // Disable zoom
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            
            // Set custom user agent
            userAgentString = "$userAgentString LessonPlannerApp/1.0"
        }
        
        // Disable overscroll
        webView.overScrollMode = WebView.OVER_SCROLL_NEVER
    }
    
    private fun generateJWT(): String {
        val secret = getJWTSecret()
        val now = Date()
        val exp = Date(now.time + 3600000) // 1 hour
        
        return Jwts.builder()
            .claim("tenantId", getTenantId())
            .claim("userFirstName", getUserFirstName())
            .claim("userLastName", getUserLastName())
            .claim("username", getUsername())
            .claim("role", getUserRole())
            .claim("locations", getUserLocations())
            .setIssuedAt(now)
            .setExpiration(exp)
            .signWith(SignatureAlgorithm.HS256, secret.toByteArray())
            .compact()
    }
    
    private fun loadWebViewWithJWT() {
        val token = generateJWT()
        val url = "https://your-domain.replit.app/tablet?token=$token"
        webView.loadUrl(url)
    }
    
    private fun refreshToken() {
        val newToken = generateJWT()
        val javascript = """
            window.postMessage({
                type: 'AUTH_TOKEN',
                token: '$newToken'
            }, '*');
        """
        webView.evaluateJavascript(javascript, null)
    }
}
```

### Token Refresh Strategy (Android)
```kotlin
// Using ViewModel and Coroutines
class LessonPlannerViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            while (isActive) {
                delay(3000000) // Refresh every 50 minutes
                refreshTokenInWebView()
            }
        }
    }
}

// Or using Handler
private val tokenRefreshHandler = Handler(Looper.getMainLooper())
private val tokenRefreshRunnable = object : Runnable {
    override fun run() {
        refreshToken()
        tokenRefreshHandler.postDelayed(this, 3000000)
    }
}

override fun onResume() {
    super.onResume()
    tokenRefreshHandler.post(tokenRefreshRunnable)
}

override fun onPause() {
    super.onPause()
    tokenRefreshHandler.removeCallbacks(tokenRefreshRunnable)
}
```

## Security Best Practices

### 1. **Token Storage**
- **Never** hardcode JWT secrets in mobile apps
- Store secrets in secure backend or use device keychain/keystore
- Generate tokens server-side when possible

### 2. **Token Expiration**
- Set reasonable expiration times (1-2 hours recommended)
- Implement automatic refresh before expiration
- Clear tokens on logout/app termination

### 3. **HTTPS Only**
- Always use HTTPS in production
- Implement certificate pinning for additional security
- Validate SSL certificates

### 4. **WebView Security**
```javascript
// Disable file access
webSettings.setAllowFileAccess(false);
webSettings.setAllowContentAccess(false);

// Only allow your domain
webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return !url.startsWith("https://your-domain.replit.app");
    }
});
```

## Performance Optimizations

### 1. **Preload WebView**
Initialize WebView on app launch but keep it hidden until needed:
```swift
// iOS
let preloadedWebView = WKWebView()
preloadedWebView.load(URLRequest(url: URL(string: "https://your-domain.replit.app/tablet")!))
```

### 2. **Cache Strategy**
```kotlin
// Android
webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
```

### 3. **Bundle Critical Resources**
Consider bundling critical CSS/JS with the app to reduce initial load time.

## Testing Checklist

### Authentication
- [ ] Token generation with correct claims
- [ ] Token passed via URL parameter
- [ ] Token refresh via PostMessage
- [ ] Token expiration handling
- [ ] Invalid token rejection

### WebView Integration
- [ ] Page loads correctly
- [ ] Touch interactions work
- [ ] No pinch-to-zoom
- [ ] Safe area handling (notches/cutouts)
- [ ] Orientation changes handled
- [ ] Memory leaks prevented

### Security
- [ ] HTTPS enforced
- [ ] Tokens expire appropriately
- [ ] No sensitive data in URLs after initial load
- [ ] WebView file access disabled
- [ ] Domain whitelist implemented

## Troubleshooting

### Common Issues

1. **Token Not Received**
   - Check URL encoding of token
   - Verify PostMessage listener is active
   - Check for CORS issues

2. **Layout Issues**
   - Verify viewport meta tag
   - Check safe area CSS variables
   - Test on multiple device sizes

3. **Performance Issues**
   - Enable hardware acceleration
   - Check for memory leaks
   - Profile JavaScript execution

## API Reference

### Endpoints Used by Tablet View
- `GET /api/scheduled-activities/:roomId` - Fetch activities for recording
- `GET /api/locations` - Get authorized locations
- `GET /api/rooms` - Get rooms for location
- `GET /api/activities` - Activity library
- `POST /api/activity-records` - Save recording data

All endpoints require Bearer token authentication in the Authorization header.