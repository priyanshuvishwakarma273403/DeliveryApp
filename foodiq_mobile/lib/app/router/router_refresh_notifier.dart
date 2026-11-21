import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(Ref ref, ProviderListenable listenable) {
    ref.listen(listenable, (_, __) => notifyListeners());
  }
}
