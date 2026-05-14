import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {getStoredToken} from './src/api/httpClient';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';

function App() {
  const [booting, setBooting] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getStoredToken();
      if (!cancelled) {
        setSignedIn(!!token);
        setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLoggedIn = useCallback(() => setSignedIn(true), []);
  const onSignedOut = useCallback(() => setSignedIn(false), []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={signedIn ? 'dark-content' : 'light-content'}
      />
      {booting ? (
        <View style={styles.boot}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : signedIn ? (
        <HomeScreen onSignedOut={onSignedOut} />
      ) : (
        <LoginScreen onLoggedIn={onLoggedIn} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
});

export default App;
