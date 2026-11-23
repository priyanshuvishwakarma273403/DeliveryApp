import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/app/app.dart';
import 'package:foodiq_mobile/app/config/env_config.dart';
import 'package:foodiq_mobile/core/storage/local_storage_service.dart';
import 'package:foodiq_mobile/core/storage/secure_storage_service.dart';
import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 0,
    errorMethodCount: 5,
    lineLength: 80,
    colors: true,
    printEmojis: true,
  ),
);

Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Modern Flutter crash and unhandled error handling
  FlutterError.onError = (details) {
    logger.e('Flutter UI Error', error: details.exception, stackTrace: details.stack);
  };

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Load environment variables safely
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    logger.w('Could not load .env file, using default environment config: $e');
  }

  // Initialize storage singletons
  final localStorage = LocalStorageService();
  await localStorage.init();

  final secureStorage = SecureStorageService();

  runApp(
    ProviderScope(
      overrides: [
        localStorageProvider.overrideWithValue(localStorage),
        secureStorageProvider.overrideWithValue(secureStorage),
      ],
      child: const FoodIQApp(),
    ),
  );
}
