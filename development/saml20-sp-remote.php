<?php
$metadata['profile-api.gtis.guru'] = [
  'entityID' => 'profile-api.gtis.guru',
  'AssertionConsumerService' => [
    [
      'index' => 1,
      'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
      'Location' => 'https://profile-api.gtis.guru/auth/login',
    ],
  ],
  'validate.authnrequest' => false,
  'validate.logout' => false,
  'saml20.sign.response' => false,
  'saml20.sign.assertion' => false,
  'assertion.encryption' => false,
];
