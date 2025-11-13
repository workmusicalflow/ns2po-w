# API KEY
re_c4sNrjvc_3oQoAfB4JGy6Yztz5mfwfYzY

# Configuration Domaine
**Domaine vérifié** : `reachup.site`
**Sous-domaine email** : `send.reachup.site`
**Adresse d'envoi** : `noreply@send.reachup.site`

## Statut Configuration
- ✅ Domaine ajouté dans Resend Dashboard
- ✅ DNS configurés chez LWS (2025-01-21 00:22 GMT)
- ✅ DNS propagés et vérifiés (2025-01-21 00:26 GMT - 4 minutes!)
- ⏳ Vérification Resend en cours (vérifier Dashboard)

## Vérification DNS (dig commands)
```bash
# MX Record ✅
dig MX send.reachup.site
# → 10 feedback-smtp.eu-west-1.amazonses.com

# SPF Record ✅
dig TXT send.reachup.site
# → "v=spf1 include:amazonses.com ~all"

# DKIM Record ✅
dig TXT resend._domainkey.reachup.site
# → "p=MIGfMA0GCS..." (clé publique complète)

# DMARC Record ✅
dig TXT _dmarc.reachup.site
# → "v=DMARC1; p=quarantine;" (+ doublon p=none)
```

## Timeline Réelle
1. **2025-01-21 00:22 GMT** : DNS ajoutés chez LWS ✅
2. **2025-01-21 00:26 GMT** : DNS propagés (4 minutes!) ✅
3. **Prochaine étape** : Vérifier Resend Dashboard pour statut ✅
4. **Production** : Prêt pour envoi emails via `send.reachup.site` ✅

# DNS Records
## DKIM and SPF
Enable email signing and specify authorized senders.

**Type:**MX
**Host/Name:**send
**Value:**feedback-smtp.eu-west-1.amazonses.com

**Type:**TXT
**Host/Name:**send
**Value:**v=spf1 include:amazonses.com ~all

**Type:**TXT
**Host/Name:**resend._domainkey
**Value:**p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCp563oS3o9QrHDghct1ONk/vb95PBWg32BQzH+rk3+Ng2bSgCNtuBDLzLRim2Dm3rQaeRt8u3TnL9hs09PvBKgzEz4cRvrog4ArwPPxuMlynNm8RjFAqbBu6btBebOWz93OTD6RLrlX3LZED5bRxFjSL4sGvkrZ2El3QfX/f9QWQIDAQAB

## DMARC
Set authentication policies and receive reports.

**Type:**TXT
**Host/Name:**_dmarc
**Value:**v=DMARC1; p=none;