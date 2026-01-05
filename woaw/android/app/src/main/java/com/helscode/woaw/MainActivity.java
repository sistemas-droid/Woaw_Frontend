package com.helscode.woaw;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;
import android.webkit.WebSettings;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  // 🔒 BLOQUEA EL TAMAÑO DE LETRA DEL SISTEMA
  @Override
  protected void attachBaseContext(Context newBase) {
    Configuration config = new Configuration(newBase.getResources().getConfiguration());
    config.fontScale = 1.0f;
    Context context = newBase.createConfigurationContext(config);
    super.attachBaseContext(context);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    Window window = getWindow();

    // 1) Edge-to-edge
    WindowCompat.setDecorFitsSystemWindows(window, false);

    // 2) Colores de status / nav bar
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.setStatusBarColor(0xFFD62828);      // rojo
      window.setNavigationBarColor(0xFF101010);  // oscuro
    }

    // 3) Insets
    final View root = findViewById(android.R.id.content);
    ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
      Insets sysBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
      v.setPadding(sysBars.left, sysBars.top, sysBars.right, sysBars.bottom);
      return WindowInsetsCompat.CONSUMED;
    });
    ViewCompat.requestApplyInsets(root);

    // 4) 🔥 Apagar dark mode automático del WebView (API 29+)
    WebView webView = (WebView) this.bridge.getWebView();
    if (webView != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      WebSettings settings = webView.getSettings();
      settings.setForceDark(WebSettings.FORCE_DARK_OFF);
    }
  }
}
