import 'package:flutter/material.dart';

abstract final class PllayzColors {
  static const green = Color(0xFF00A86B);
  static const darkGreen = Color(0xFF007C50);
  static const ink = Color(0xFF17201D);
  static const muted = Color(0xFF64706C);
  static const canvas = Color(0xFFF6F8F7);
  static const border = Color(0xFFE3E9E6);
  static const mint = Color(0xFFE7F7F0);
  static const amber = Color(0xFFF59E0B);
  static const red = Color(0xFFD14343);
}

ThemeData buildPllayzTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: PllayzColors.green,
    brightness: Brightness.light,
    primary: PllayzColors.green,
    surface: Colors.white,
    error: PllayzColors.red,
  );
  final radius = BorderRadius.circular(18);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: PllayzColors.canvas,
    fontFamily: 'sans-serif',
    visualDensity: VisualDensity.standard,
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        color: PllayzColors.ink,
        fontSize: 34,
        fontWeight: FontWeight.w800,
        letterSpacing: -1.2,
        height: 1.08,
      ),
      headlineSmall: TextStyle(
        color: PllayzColors.ink,
        fontSize: 24,
        fontWeight: FontWeight.w800,
        letterSpacing: -.55,
      ),
      titleLarge: TextStyle(
        color: PllayzColors.ink,
        fontSize: 19,
        fontWeight: FontWeight.w700,
        letterSpacing: -.25,
      ),
      titleMedium: TextStyle(
        color: PllayzColors.ink,
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: TextStyle(color: PllayzColors.ink, fontSize: 16, height: 1.48),
      bodyMedium: TextStyle(
        color: PllayzColors.muted,
        fontSize: 14,
        height: 1.45,
      ),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: const BorderSide(color: PllayzColors.border),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: PllayzColors.green,
        foregroundColor: Colors.white,
        minimumSize: const Size(48, 50),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: PllayzColors.ink,
        minimumSize: const Size(48, 50),
        side: const BorderSide(color: PllayzColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: PllayzColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: PllayzColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: PllayzColors.green, width: 1.5),
      ),
      labelStyle: const TextStyle(color: PllayzColors.muted),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      height: 72,
      elevation: 0,
      backgroundColor: Colors.white,
      indicatorColor: PllayzColors.mint,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      ),
    ),
    dividerColor: PllayzColors.border,
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
  );
}
