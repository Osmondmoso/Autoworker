package com.autoworker.nativeagent;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.os.Bundle;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

public class AutoWorkerAccessibilityService extends AccessibilityService {
  private static WeakReference<AutoWorkerAccessibilityService> current = new WeakReference<>(null);
  private String lastExternalText = "";
  private String lastExternalPackage = "";
  private long lastExternalReadAt = 0L;
  private AccessibilityNodeInfo lastExternalRoot;

  public static AutoWorkerAccessibilityService getInstance() { return current.get(); }
  @Override public void onServiceConnected() { super.onServiceConnected(); current = new WeakReference<>(this); }

  @Override public void onAccessibilityEvent(AccessibilityEvent event) {
    if (event == null || event.getPackageName() == null) return;
    String pkg = event.getPackageName().toString();
    if (pkg.equals(getPackageName())) return;
    AccessibilityNodeInfo root = getRootInActiveWindow();
    if (root == null) root = event.getSource();
    if (root == null) return;
    List<String> lines = new ArrayList<>();
    collectText(root, lines);
    String text = android.text.TextUtils.join("\n", lines);
    if (!text.trim().isEmpty()) {
      lastExternalText = text;
      lastExternalPackage = pkg;
      lastExternalReadAt = System.currentTimeMillis();
      if (lastExternalRoot != null) lastExternalRoot.recycle();
      lastExternalRoot = AccessibilityNodeInfo.obtain(root);
    }
  }
  @Override public void onInterrupt() { }
  @Override public void onDestroy() {
    if (lastExternalRoot != null) { lastExternalRoot.recycle(); lastExternalRoot = null; }
    if (current.get() == this) current.clear();
    super.onDestroy();
  }

  public String readVisibleText() {
    AccessibilityNodeInfo root = getRootInActiveWindow();
    if (root == null) return "";
    List<String> lines = new ArrayList<>();
    collectText(root, lines);
    return android.text.TextUtils.join("\n", lines);
  }
  public String readLastExternalText() { return lastExternalText; }
  public String getLastExternalPackage() { return lastExternalPackage; }
  public long getLastExternalReadAt() { return lastExternalReadAt; }

  private void collectText(AccessibilityNodeInfo node, List<String> lines) {
    if (node == null) return;
    CharSequence text = node.getText(), desc = node.getContentDescription();
    if (text != null && text.length() > 0) lines.add(text.toString());
    else if (desc != null && desc.length() > 0) lines.add(desc.toString());
    for (int i = 0; i < node.getChildCount(); i++) collectText(node.getChild(i), lines);
  }
  public boolean clickText(String target) {
    AccessibilityNodeInfo root = getRootInActiveWindow();
    if (root == null || getPackageName().equals(lastExternalPackage)) root = lastExternalRoot;
    return root != null && target != null && clickMatching(root, target.toLowerCase());
  }
  private boolean clickMatching(AccessibilityNodeInfo node, String target) {
    if (node == null) return false;
    CharSequence t=node.getText(), d=node.getContentDescription();
    String value=((t==null?"":t.toString())+" "+(d==null?"":d.toString())).toLowerCase();
    if (value.contains(target) && node.isVisibleToUser()) {
      AccessibilityNodeInfo candidate=node;
      while(candidate!=null) {
        if(candidate.isClickable()) return candidate.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        candidate=candidate.getParent();
      }
    }
    for(int i=0;i<node.getChildCount();i++) if(clickMatching(node.getChild(i),target)) return true;
    return false;
  }
  public boolean typeIntoFocusedField(String value) {
    AccessibilityNodeInfo root=getRootInActiveWindow();
    if(root==null || getPackageName().equals(lastExternalPackage)) root=lastExternalRoot;
    if(root==null) return false;
    AccessibilityNodeInfo focused=root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
    if(focused==null || !focused.isEditable()) return false;
    Bundle args=new Bundle();
    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,value);
    return focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT,args);
  }
  public boolean scroll(String direction) {
    AccessibilityNodeInfo root=getRootInActiveWindow();
    if(root==null || getPackageName().equals(lastExternalPackage)) root=lastExternalRoot;
    if(root==null) return false;
    int action="up".equalsIgnoreCase(direction)?AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD:AccessibilityNodeInfo.ACTION_SCROLL_FORWARD;
    return scrollFirst(root,action);
  }
  private boolean scrollFirst(AccessibilityNodeInfo node,int action) {
    if(node==null) return false;
    if(node.isScrollable() && node.performAction(action)) return true;
    for(int i=0;i<node.getChildCount();i++) if(scrollFirst(node.getChild(i),action)) return true;
    return false;
  }
}