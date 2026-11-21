class AuthTokens {
  final String accessToken;
  final String? refreshToken;
  final String tokenType;
  final int? expiresIn;

  const AuthTokens({
    required this.accessToken,
    this.refreshToken,
    this.tokenType = 'Bearer',
    this.expiresIn,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken']?.toString(),
      tokenType: json['tokenType'] ?? 'Bearer',
      expiresIn: json['expiresIn'] is int
          ? json['expiresIn']
          : int.tryParse(json['expiresIn']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'tokenType': tokenType,
      'expiresIn': expiresIn,
    };
  }
}
