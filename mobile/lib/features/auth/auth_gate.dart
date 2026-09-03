import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/pllayz_repository.dart';
import '../../ui/app_theme.dart';
import '../../ui/common.dart';
import '../shell/adaptive_shell.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  late final StreamSubscription<AuthState> _auth;
  late final PllayzRepository _repo;
  Future<Json?>? _profile;

  @override
  void initState() {
    super.initState();
    _repo = PllayzRepository(Supabase.instance.client);
    _auth = Supabase.instance.client.auth.onAuthStateChange.listen((_) {
      if (mounted) setState(_loadProfile);
    });
    _loadProfile();
  }

  void _loadProfile() {
    _profile = _resolveProfile();
  }

  Future<Json?> _resolveProfile() async {
    if (_repo.user == null) return null;
    final profile = await _repo.profile();
    if (profile != null) return profile;
    final preferences = await SharedPreferences.getInstance();
    final role = preferences.getString('pending_account_type');
    if (role == 'player' || role == 'owner') {
      return _repo.ensureProfile(role!);
    }
    return null;
  }

  @override
  void dispose() {
    _auth.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_repo.user == null) return const LoginScreen();
    return FutureBuilder<Json?>(
      future: _profile,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            body: SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: EmptyState(
                    icon: Icons.cloud_off_rounded,
                    title: 'We could not load your account',
                    message: '${snapshot.error}',
                    action: FilledButton(
                      onPressed: () => setState(_loadProfile),
                      child: const Text('Try again'),
                    ),
                  ),
                ),
              ),
            ),
          );
        }
        if (snapshot.connectionState != ConnectionState.done) {
          return const _BrandLoading();
        }
        final profile = snapshot.data;
        if (profile == null) {
          return RolePicker(onComplete: () => setState(_loadProfile));
        }
        if (profile['profile_complete'] != true) {
          return OnboardingScreen(
            profile: profile,
            onComplete: () => setState(_loadProfile),
          );
        }
        return AdaptiveShell(profile: profile);
      },
    );
  }
}

class _BrandLoading extends StatelessWidget {
  const _BrandLoading();

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset('assets/pllayz-mark.png', width: 76),
          const SizedBox(height: 18),
          const CircularProgressIndicator(strokeWidth: 2.4),
        ],
      ).animate().fadeIn(duration: 300.ms).scale(begin: const Offset(.96, .96)),
    ),
  );
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  String _role = 'player';
  bool _busy = false;
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _sendLink() async {
    final email = _email.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      showMessage(context, 'Enter a valid email address.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString('pending_account_type', _role);
      await Supabase.instance.client.auth.signInWithOtp(
        email: email,
        emailRedirectTo: '$webBaseUrl/mobile-auth',
        data: {'account_type': _role},
      );
      if (mounted) setState(() => _sent = true);
    } on AuthException catch (error) {
      if (mounted) showMessage(context, error.message, error: true);
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _continueWithGoogle() async {
    setState(() => _busy = true);
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString('pending_account_type', _role);
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: '$webBaseUrl/mobile-auth',
        authScreenLaunchMode: LaunchMode.externalApplication,
        queryParams: {'prompt': 'select_account'},
      );
    } on AuthException catch (error) {
      if (mounted) showMessage(context, error.message, error: true);
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight - 40,
                maxWidth: 1080,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 460),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Image.asset('assets/pllayz-mark.png', width: 70),
                      ),
                      const SizedBox(height: 26),
                      Text(
                        _sent
                            ? 'Check your inbox'
                            : 'Your next game starts here.',
                        style: Theme.of(context).textTheme.displaySmall,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _sent
                            ? 'Open the fresh sign-in link on this phone. It returns directly to Pllayz.'
                            : 'Book trusted venues, track every payment, or run your sports business.',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: PllayzColors.muted,
                        ),
                      ),
                      const SizedBox(height: 30),
                      if (!_sent) ...[
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(
                              value: 'player',
                              icon: Icon(Icons.sports_cricket_rounded),
                              label: Text('Player'),
                            ),
                            ButtonSegment(
                              value: 'owner',
                              icon: Icon(Icons.storefront_rounded),
                              label: Text('Venue owner'),
                            ),
                          ],
                          selected: {_role},
                          onSelectionChanged: (value) =>
                              setState(() => _role = value.first),
                          showSelectedIcon: false,
                        ),
                        const SizedBox(height: 18),
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => _sendLink(),
                          decoration: const InputDecoration(
                            labelText: 'Email address',
                            prefixIcon: Icon(Icons.alternate_email_rounded),
                          ),
                        ),
                        const SizedBox(height: 14),
                        BusyButton(
                          busy: _busy,
                          onPressed: _sendLink,
                          label: 'Email me a sign-in link',
                          icon: Icons.arrow_forward_rounded,
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _busy ? null : _continueWithGoogle,
                          icon: const Icon(
                            Icons.g_mobiledata_rounded,
                            size: 28,
                          ),
                          label: const Text('Continue with Google'),
                        ),
                      ] else ...[
                        FilledButton.icon(
                          onPressed: () => setState(() => _sent = false),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Use another email'),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'For security, request only one fresh link and open the newest email.',
                          textAlign: TextAlign.center,
                        ),
                      ],
                      const SizedBox(height: 26),
                      const _TrustRow(),
                    ],
                  ).animate().fadeIn(duration: 420.ms).slideY(begin: .035),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TrustRow extends StatelessWidget {
  const _TrustRow();

  @override
  Widget build(BuildContext context) => const Wrap(
    alignment: WrapAlignment.center,
    spacing: 16,
    runSpacing: 10,
    children: [
      _TrustItem(Icons.lock_outline_rounded, 'Secure sign-in'),
      _TrustItem(Icons.verified_outlined, 'Verified payments'),
      _TrustItem(Icons.groups_2_outlined, 'Team matchmaking'),
    ],
  );
}

class _TrustItem extends StatelessWidget {
  const _TrustItem(this.icon, this.label);
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 17, color: PllayzColors.green),
      const SizedBox(width: 6),
      Text(label, style: const TextStyle(fontSize: 12)),
    ],
  );
}

class RolePicker extends StatefulWidget {
  const RolePicker({required this.onComplete, super.key});
  final VoidCallback onComplete;

  @override
  State<RolePicker> createState() => _RolePickerState();
}

class _RolePickerState extends State<RolePicker> {
  bool _busy = false;

  Future<void> _choose(String role) async {
    setState(() => _busy = true);
    try {
      await PllayzRepository(Supabase.instance.client).ensureProfile(role);
      widget.onComplete();
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              children: [
                Image.asset('assets/pllayz-mark.png', width: 68),
                const SizedBox(height: 22),
                Text(
                  'How will you use Pllayz?',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                _RoleCard(
                  icon: Icons.sports_cricket_rounded,
                  title: 'I want to play',
                  message: 'Find venues, reserve slots and meet opponents.',
                  onTap: _busy ? null : () => _choose('player'),
                ),
                const SizedBox(height: 12),
                _RoleCard(
                  icon: Icons.storefront_rounded,
                  title: 'I manage venues',
                  message: 'Publish courts, control availability and revenue.',
                  onTap: _busy ? null : () => _choose('owner'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.message,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String message;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => PllayzCard(
    onTap: onTap,
    child: Row(
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: const BoxDecoration(
            color: PllayzColors.mint,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: PllayzColors.green),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(message),
            ],
          ),
        ),
        const Icon(Icons.arrow_forward_ios_rounded, size: 16),
      ],
    ),
  );
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    required this.profile,
    required this.onComplete,
    super.key,
  });
  final Json profile;
  final VoidCallback onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late final TextEditingController _name;
  late final TextEditingController _business;
  String _city = 'Chandigarh';
  bool _busy = false;

  bool get _owner => widget.profile['account_type'] == 'owner';

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: '${widget.profile['full_name'] ?? ''}');
    _business = TextEditingController(
      text: '${widget.profile['business_name'] ?? ''}',
    );
    _city = '${widget.profile['city'] ?? 'Chandigarh'}';
  }

  @override
  void dispose() {
    _name.dispose();
    _business.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().length < 2) {
      showMessage(context, 'Enter your full name.', error: true);
      return;
    }
    if (_owner && _business.text.trim().length < 2) {
      showMessage(context, 'Enter your business name.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await PllayzRepository(Supabase.instance.client).updateProfile(
        fullName: _name.text,
        city: _city,
        businessName: _owner ? _business.text : null,
      );
      widget.onComplete();
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Image.asset(
                  'assets/pllayz-mark.png',
                  width: 64,
                  alignment: Alignment.centerLeft,
                ),
                const SizedBox(height: 22),
                Text(
                  'Set up your profile',
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: 8),
                Text(
                  _owner
                      ? 'A few details before you start managing venues.'
                      : 'Tell us where you play so we can personalise Pllayz.',
                ),
                const SizedBox(height: 28),
                TextField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Full name',
                    prefixIcon: Icon(Icons.person_outline_rounded),
                  ),
                ),
                if (_owner) ...[
                  const SizedBox(height: 14),
                  TextField(
                    controller: _business,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Business name',
                      prefixIcon: Icon(Icons.storefront_rounded),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _city,
                  decoration: const InputDecoration(
                    labelText: 'City',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                  items: const ['Chandigarh', 'Mohali', 'Panchkula']
                      .map(
                        (city) =>
                            DropdownMenuItem(value: city, child: Text(city)),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => _city = value ?? _city),
                ),
                const SizedBox(height: 20),
                BusyButton(
                  busy: _busy,
                  onPressed: _save,
                  label: 'Continue to Pllayz',
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
