package dev.rtalado.ironmarch;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Thin fullscreen WebView shell around the hosted game. The game itself is a
 * PWA: its service worker caches everything for offline play and pulls pushed
 * updates on launch, so this APK almost never needs rebuilding.
 */
public class MainActivity extends Activity {
    private static final String GAME_HOST = "rtalado.github.io";
    private static final String GAME_URL = "https://" + GAME_HOST + "/trifold-ironmarch/";
    private static final String RETRY_SCHEME = "app";

    private static final String OFFLINE_HTML =
        "<html><body style=\"background:#0c0d11;color:#6a7288;font-family:Georgia,serif;" +
        "display:flex;align-items:center;justify-content:center;height:100%;text-align:center\">" +
        "<div><p style=\"color:#d8b45a;letter-spacing:.2em\">THE COLUMN AWAITS ORDERS</p>" +
        "<p>No connection, and the game isn't cached yet.<br>" +
        "Connect once and it will march offline from then on.</p>" +
        "<p><a href=\"app://retry\" style=\"color:#d8b45a\">TRY AGAIN</a></p></div></body></html>";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        web.setBackgroundColor(Color.parseColor("#0c0d11"));
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (RETRY_SCHEME.equals(u.getScheme())) { v.loadUrl(GAME_URL); return true; }
                if (GAME_HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) {
                    v.loadDataWithBaseURL(null, OFFLINE_HTML, "text/html", "utf-8", null);
                }
            }
        });
        setContentView(web);
        hideSystemBars();
        web.loadUrl(GAME_URL);
    }

    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else moveTaskToBack(true);
    }
}
