package com.autoworker.nativeagent;

import android.content.Intent;
import android.provider.Settings;
import android.provider.Settings.Secure;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AutoWorkerNative")
public class AutoWorkerNativePlugin extends Plugin {
  @PluginMethod public void isAccessibilityEnabled(PluginCall call) {
    String expected=getContext().getPackageName()+"/"+AutoWorkerAccessibilityService.class.getName();
    String enabled=Secure.getString(getContext().getContentResolver(),Secure.ENABLED_ACCESSIBILITY_SERVICES);
    boolean active=false;
    if(enabled!=null) for(String item:enabled.split(":")) if(item.equalsIgnoreCase(expected)) active=true;
    JSObject result=new JSObject(); result.put("enabled",active); call.resolve(result);
  }
  @PluginMethod public void openAccessibilitySettings(PluginCall call) {
    getActivity().startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); call.resolve();
  }
  @PluginMethod public void launchApp(PluginCall call) {
    String packageName=call.getString("packageName");
    if(packageName==null || packageName.trim().isEmpty()) { call.reject("packageName is required"); return; }
    Intent intent=getContext().getPackageManager().getLaunchIntentForPackage(packageName);
    if(intent==null) { call.reject("That app is not installed or cannot be launched"); return; }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(intent); call.resolve();
  }
  @PluginMethod public void readVisibleText(PluginCall call) {
    AutoWorkerAccessibilityService service=AutoWorkerAccessibilityService.getInstance();
    if(service==null) { call.reject("Enable AutoWorker Phone Control in Android Accessibility settings first"); return; }
    JSObject result=new JSObject(); result.put("text",service.readVisibleText()); call.resolve(result);
  }
  @PluginMethod public void clickText(PluginCall call) {
    AutoWorkerAccessibilityService service=AutoWorkerAccessibilityService.getInstance();
    if(service==null) { call.reject("Accessibility service is not enabled"); return; }
    JSObject result=new JSObject(); result.put("clicked",service.clickText(call.getString("text"))); call.resolve(result);
  }
  @PluginMethod public void typeText(PluginCall call) {
    AutoWorkerAccessibilityService service=AutoWorkerAccessibilityService.getInstance();
    if(service==null) { call.reject("Accessibility service is not enabled"); return; }
    JSObject result=new JSObject(); result.put("typed",service.typeIntoFocusedField(call.getString("text",""))); call.resolve(result);
  }
  @PluginMethod public void scroll(PluginCall call) {
    AutoWorkerAccessibilityService service=AutoWorkerAccessibilityService.getInstance();
    if(service==null) { call.reject("Accessibility service is not enabled"); return; }
    JSObject result=new JSObject(); result.put("scrolled",service.scroll(call.getString("direction","down"))); call.resolve(result);
  }
}
