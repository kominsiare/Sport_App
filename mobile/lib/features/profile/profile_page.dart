import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/pllayz_repository.dart';
import '../../ui/app_theme.dart';
import '../../ui/common.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({required this.profile, super.key});

  final Json profile;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late Json _profile;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _profile = Map<String, dynamic>.from(widget.profile);
  }

  Future<void> _edit() async {
    final name = TextEditingController(text: '${_profile['full_name'] ?? ''}');
    final business = TextEditingController(
      text: '${_profile['business_name'] ?? ''}',
    );
    var city = '${_profile['city'] ?? 'Chandigarh'}';
    final owner = _profile['account_type'] == 'owner';
    final value = await showDialog<(String, String, String?)>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Edit profile'),
          content: SizedBox(
            width: 440,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: name,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Full name'),
                  ),
                  if (owner) ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: business,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Business name',
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: city,
                    decoration: const InputDecoration(labelText: 'City'),
                    items: const ['Chandigarh', 'Mohali', 'Panchkula']
                        .map(
                          (value) => DropdownMenuItem(
                            value: value,
                            child: Text(value),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setDialogState(() => city = value ?? city),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (name.text.trim().length < 2 ||
                    (owner && business.text.trim().length < 2)) {
                  showMessage(
                    context,
                    'Complete the required profile details.',
                    error: true,
                  );
                  return;
                }
                Navigator.pop(context, (
                  name.text.trim(),
                  city,
                  owner ? business.text.trim() : null,
                ));
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    name.dispose();
    business.dispose();
    if (value == null) return;
    setState(() => _busy = true);
    try {
      final updated = await PllayzRepository(Supabase.instance.client)
          .updateProfile(
            fullName: value.$1,
            city: value.$2,
            businessName: value.$3,
          );
      if (mounted) {
        setState(() => _profile = updated);
        showMessage(context, 'Profile updated.');
      }
    } catch (error) {
      if (mounted) showMessage(context, '$error', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = '${_profile['full_name'] ?? 'Pllayz member'}';
    final owner = _profile['account_type'] == 'owner';
    return PageFrame(
      title: 'Profile',
      subtitle: 'Your account, verification and support.',
      actions: [
        IconButton.filledTonal(
          onPressed: _busy ? null : _edit,
          tooltip: 'Edit profile',
          icon: _busy
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.edit_outlined),
        ),
      ],
      child: Column(
        children: [
          PllayzCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: PllayzColors.mint,
                  child: Text(
                    name.isEmpty ? 'P' : name.substring(0, 1).toUpperCase(),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: PllayzColors.green,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text('${_profile['email'] ?? ''}'),
                      const SizedBox(height: 8),
                      StatusPill(owner ? 'venue owner' : 'player'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          PllayzCard(
            child: Column(
              children: [
                _InfoRow(
                  Icons.location_on_outlined,
                  'City',
                  '${_profile['city'] ?? 'Not set'}',
                ),
                const Divider(height: 28),
                _InfoRow(
                  Icons.verified_user_outlined,
                  'Email',
                  _profile['email_verified_at'] != null
                      ? 'Verified'
                      : 'Verification pending',
                ),
                if (owner) ...[
                  const Divider(height: 28),
                  _InfoRow(
                    Icons.storefront_outlined,
                    'Business',
                    '${_profile['business_name'] ?? 'Not set'}',
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          PllayzCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                OutlinedButton.icon(
                  onPressed: () => launchUrl(
                    Uri.parse('$webBaseUrl/privacy'),
                    mode: LaunchMode.externalApplication,
                  ),
                  icon: const Icon(Icons.shield_outlined),
                  label: const Text('Privacy and support'),
                ),
                const SizedBox(height: 10),
                FilledButton.tonalIcon(
                  onPressed: () async {
                    await Supabase.instance.client.auth.signOut();
                  },
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.label, this.value);
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: PllayzColors.green),
      const SizedBox(width: 12),
      Expanded(child: Text(label)),
      Text(
        value,
        style: const TextStyle(
          color: PllayzColors.ink,
          fontWeight: FontWeight.w700,
        ),
      ),
    ],
  );
}
