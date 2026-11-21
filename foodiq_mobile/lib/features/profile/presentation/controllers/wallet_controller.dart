import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:foodiq_mobile/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:foodiq_mobile/features/profile/data/repositories/profile_repository_impl.dart';
import 'package:foodiq_mobile/features/profile/domain/models/user_wallet_model.dart';

final walletControllerProvider =
    AsyncNotifierProvider<WalletNotifier, UserWalletModel>(WalletNotifier.new);

class WalletNotifier extends AsyncNotifier<UserWalletModel> {
  @override
  Future<UserWalletModel> build() async {
    final auth = ref.watch(authControllerProvider);
    final userId = auth.user?.id ?? 0;
    final repo = ref.watch(profileRepositoryProvider);
    return await repo.getWallet(userId);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final auth = ref.read(authControllerProvider);
      final userId = auth.user?.id ?? 0;
      final repo = ref.read(profileRepositoryProvider);
      return await repo.getWallet(userId);
    });
  }

  Future<bool> upgradeToGold() async {
    try {
      final auth = ref.read(authControllerProvider);
      final userId = auth.user?.id ?? 0;
      final repo = ref.read(profileRepositoryProvider);
      await repo.subscribeGold(userId);
      await refresh();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> redeemCard(String code) async {
    try {
      final auth = ref.read(authControllerProvider);
      final userId = auth.user?.id.toString() ?? '';
      final repo = ref.read(profileRepositoryProvider);
      await repo.redeemGiftCard(code, userId);
      await refresh();
      return true;
    } catch (_) {
      return false;
    }
  }
}
