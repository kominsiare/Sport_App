import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'features/auth/auth_gate.dart';
import 'ui/app_theme.dart';

const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  if (supabaseUrl.isNotEmpty && supabaseKey.isNotEmpty) {
    await Supabase.initialize(
      url: supabaseUrl,
      publishableKey: supabaseKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }
  runApp(const PllayzApp());
}

class PllayzApp extends StatelessWidget {
  const PllayzApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pllayz',
      debugShowCheckedModeBanner: false,
      theme: buildPllayzTheme(),
      home: supabaseUrl.isEmpty || supabaseKey.isEmpty
          ? const _MissingConfiguration()
          : const AuthGate(),
    );
  }
}

class _MissingConfiguration extends StatelessWidget {
  const _MissingConfiguration();

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset('assets/pllayz-mark.png', width: 74),
              const SizedBox(height: 20),
              Text(
                'Build configuration missing',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 10),
              const Text(
                'Build Pllayz with SUPABASE_URL and '
                'SUPABASE_PUBLISHABLE_KEY dart defines.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
