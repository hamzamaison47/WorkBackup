// import React, {useEffect, useRef} from 'react';
// import {Animated, Easing, ImageBackground} from 'react-native';
// // import LinearGradient from 'react-native-linear-gradient';
// import {useSelector, useDispatch} from 'react-redux';
// import {setSkipLoginAfterRestart} from '../store/slices/languageSlice';
// import {jwtDecode} from 'jwt-decode';
// import {
//   fetchUserInfo,
//   fetchEmployeeLegalEntities,
//   fetchEmployeeMenuItems,
// } from '../Controller/authUtils';
// import {setUserData} from '../store/slices/userSlice';
// import {
//   initializeLegalEntity,
//   setLegalEntities,
// } from '../store/slices/companySlice';
// import {setMenuItems} from '../store/slices/menuItemSlice';
// import {setFirebaseUserData} from '../store/slices/firebaseSlice';
// import styles from '../styles/styles';

// const SplashScreens = ({navigation}) => {
//   const dispatch = useDispatch();
//   const skipLogin = useSelector(state => state.language.skipLoginAfterRestart);
//   const accessToken = useSelector(state => state.auth.accessToken);
//   const idToken = useSelector(state => state.auth.idToken);
//   const userToken = useSelector(state => state.auth.userToken);
//   const rehydrated = useSelector(state => state._persist?.rehydrated);
//   const userData = useSelector(state => state.user.userData);
//   const menuItems = useSelector(state => state.menuItem.menuItems);
//   const company = useSelector(state => state.company);
//   const didBootstrapRef = useRef(false);
//   const loginTimeoutRef = useRef(null);
//   const drawerTimeoutRef = useRef(null);
//   const waitForSessionTimeoutRef = useRef(null);

//   // Animations
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const textOpacity = useRef(new Animated.Value(0)).current;
//   const taglineOpacity = useRef(new Animated.Value(0)).current;
//   const circlePulse1 = useRef(new Animated.Value(0)).current;
//   const circlePulse2 = useRef(new Animated.Value(0)).current;
//   const circlePulse3 = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const fadeInContent = () => {
//       // Staggered fade in for logo and text
//       Animated.stagger(300, [
//         Animated.timing(logoOpacity, {
//           toValue: 1,
//           duration: 1000,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//         Animated.timing(textOpacity, {
//           toValue: 1,
//           duration: 800,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//         Animated.timing(taglineOpacity, {
//           toValue: 1,
//           duration: 600,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//       ]).start();
//     };

//     // Staggered circle animations
//     Animated.stagger(400, [
//       Animated.timing(circlePulse1, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//       Animated.timing(circlePulse2, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//       Animated.timing(circlePulse3, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//     ]).start();

//     const clearPendingNavigation = () => {
//       if (loginTimeoutRef.current) {
//         clearTimeout(loginTimeoutRef.current);
//         loginTimeoutRef.current = null;
//       }
//       if (drawerTimeoutRef.current) {
//         clearTimeout(drawerTimeoutRef.current);
//         drawerTimeoutRef.current = null;
//       }
//       if (waitForSessionTimeoutRef.current) {
//         clearTimeout(waitForSessionTimeoutRef.current);
//         waitForSessionTimeoutRef.current = null;
//       }
//     };

//     const checkAuthStatus = () => {
//       try {
//         fadeInContent();

//         // Wait until redux-persist finishes rehydration; otherwise tokens/flags may
//         // not be available yet (common after RTL restart).
//         if (!rehydrated) {
//           return;
//         }

//         clearPendingNavigation();

//         const hasSession = Boolean(
//           accessToken || idToken || userToken || userData?.employeeId,
//         );

//         console.log('Splash auth check:', {
//           rehydrated,
//           skipLogin,
//           hasSession,
//           hasAccessToken: Boolean(accessToken),
//           hasIdToken: Boolean(idToken),
//           hasUserToken: Boolean(userToken),
//           hasUserData: Boolean(userData?.employeeId),
//         });

//         const bootstrapSessionIfNeeded = async () => {
//           if (!hasSession) {
//             return;
//           }
//           if (didBootstrapRef.current) {
//             return;
//           }

//           const missingUser = !userData?.employeeId;
//           const missingMenus =
//             !Array.isArray(menuItems) || menuItems.length === 0;
//           const missingCompany =
//             !company?.selectedLegalEntity ||
//             !Array.isArray(company?.legalEntities) ||
//             company.legalEntities.length === 0;

//           if (!missingUser && !missingMenus && !missingCompany) {
//             return;
//           }

//           didBootstrapRef.current = true;

//           try {
//             const token = accessToken || idToken || userToken;
//             const decoded = jwtDecode(token);
//             const email = decoded?.upn || decoded?.email;

//             if (!email) {
//               return;
//             }

//             const userInfo = await fetchUserInfo(email);
//             if (!userInfo.length || !userInfo[0]?.EmployeeId) {
//               return;
//             }

//             const user = userInfo[0];
//             const completeUserData = {
//               userName: decoded?.name || user.EmployeeName,
//               employeeName: user.EmployeeName,
//               employeeId: user.EmployeeId,
//               WorkerRecId: user.WorkerRecId,
//               email: email,
//               jobId: user.JobId,
//               department: user.Department,
//               defaultLegalEntity: user.DefaultLegalEntity,
//               PositionDescription: user.PositionDescription,
//               CreatedBy: user.CreatedBy,
//               CreatedDateTime: user.CreatedDateTime,
//               DataAreaId: user.DataAreaId,
//               IsEnrolledInPayroll: user.IsEnrolledInPayroll,
//               JobDescription: user.JobDescription,
//               ModifiedBy: user.ModifiedBy,
//               ModifiedDateTime: user.ModifiedDateTime,
//               OriginalHireDate: user.OriginalHireDate,
//               Partition: user.Partition,
//               Person: user.Person,
//               Positionid: user.Positionid,
//               RecId: user.RecId,
//               isDynamicsUser: user.isDynamicsUser,
//               employeeFullInfo: user,
//             };

//             dispatch(setUserData(completeUserData));
//             dispatch(initializeLegalEntity(user.DefaultLegalEntity));

//             const [legalEntities, menus] = await Promise.all([
//               fetchEmployeeLegalEntities(user.EmployeeId),
//               fetchEmployeeMenuItems(user.Person),
//             ]);

//             if (Array.isArray(legalEntities)) {
//               dispatch(setLegalEntities(legalEntities));
//             }
//             if (Array.isArray(menus)) {
//               dispatch(setMenuItems(menus));
//             }

//             dispatch(
//               setFirebaseUserData({
//                 userEmail: email,
//                 employeeId: user.EmployeeId,
//                 company: user.DefaultLegalEntity,
//               }),
//             );
//           } catch (e) {
//             console.log('Splash session bootstrap error:', e);
//           }
//         };

//         if (skipLogin) {
//           if (hasSession) {
//             // Only skip Login during the language-change restart case
//             drawerTimeoutRef.current = setTimeout(() => {
//               dispatch(setSkipLoginAfterRestart(false));
//               Promise.resolve(bootstrapSessionIfNeeded()).finally(() => {
//                 navigation.replace('DrawerNavigator');
//               });
//             }, 2000);
//             return;
//           }

//           // Language restart was requested, but session data hasn't rehydrated yet.
//           // Wait a bit instead of routing to Login immediately.
//           console.log('Splash waiting for session after language restart...');
//           waitForSessionTimeoutRef.current = setTimeout(() => {
//             console.log(
//               'Splash wait expired; sending user to Login (no session after restart)',
//             );
//             dispatch(setSkipLoginAfterRestart(false));
//             navigation.replace('Login');
//           }, 4000);
//           return;
//         }

//         // Normal flow - go to Login
//         loginTimeoutRef.current = setTimeout(() => {
//           navigation.replace('Login');
//         }, 3000);
//       } catch (error) {
//         console.log('Splash screen error:', error);
//         navigation.replace('Login');
//       }
//     };

//     checkAuthStatus();

//     return () => {
//       clearPendingNavigation();
//     };
//   }, [
//     navigation,
//     logoOpacity,
//     textOpacity,
//     taglineOpacity,
//     circlePulse1,
//     circlePulse2,
//     circlePulse3,
//     skipLogin,
//     accessToken,
//     idToken,
//     userToken,
//     rehydrated,
//     userData?.employeeId,
//     menuItems,
//     company.selectedLegalEntity,
//     company.legalEntities,
//     dispatch,
//   ]);

//   // Circle scale interpolations
//   const circle1Scale = circlePulse1.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.3, 1],
//   });

//   const circle2Scale = circlePulse2.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.3, 1],
//   });

//   const circle3Scale = circlePulse3.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.3, 1],
//   });

//   const circle1Opacity = circlePulse1.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, 0.15],
//   });

//   const circle2Opacity = circlePulse2.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, 0.1],
//   });

//   const circle3Opacity = circlePulse3.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, 0.08],
//   });

//   // return (
//   //   <LinearGradient
//   //     colors={['#0A66C2', '#bddeff']}
//   //     style={styles.splash_Container}>
//   //     {/* Background Circles */}
//   //     <Animated.View
//   //       style={[
//   //         styles.splash_Circle1,
//   //         {
//   //           opacity: circle1Opacity,
//   //           transform: [{scale: circle1Scale}],
//   //         },
//   //       ]}
//   //     />
//   //     <Animated.View
//   //       style={[
//   //         styles.splash_Circle2,
//   //         {
//   //           opacity: circle2Opacity,
//   //           transform: [{scale: circle2Scale}],
//   //         },
//   //       ]}
//   //     />
//   //     <Animated.View
//   //       style={[
//   //         styles.splash_Circle3,
//   //         {
//   //           opacity: circle3Opacity,
//   //           transform: [{scale: circle3Scale}],
//   //         },
//   //       ]}
//   //     />

//   //     {/* Logo with fade animation */}
//   //     <Animated.Image
//   //       source={require('../assets/cloud.png')}
//   //       style={[styles.splash_Logo, {opacity: logoOpacity}]}
//   //       resizeMode="contain"
//   //     />

//   //     {/* Text with fade animations */}
//   //     <Animated.Text style={[styles.splash_Text, {opacity: textOpacity}]}>
//   //       Dynaface By Maison
//   //     </Animated.Text>

//   //     <Animated.Text style={[styles.splash_Tagline, {opacity: taglineOpacity}]}>
//   //       Secure Mobile Gateway to Dynamics365
//   //     </Animated.Text>
//   //   </LinearGradient>
//   // );
//   return (
//     <ImageBackground
//       source={require('../assets/IDAPSplash.png')}
//       style={styles.splash_Container}
//       resizeMode="cover">
//       {/* Background Circles */}
//       <Animated.View
//         style={[
//           styles.splash_Circle1,
//           {opacity: circle1Opacity, transform: [{scale: circle1Scale}]},
//         ]}
//       />
//       <Animated.View
//         style={[
//           styles.splash_Circle2,
//           {opacity: circle2Opacity, transform: [{scale: circle2Scale}]},
//         ]}
//       />
//       <Animated.View
//         style={[
//           styles.splash_Circle3,
//           {opacity: circle3Opacity, transform: [{scale: circle3Scale}]},
//         ]}
//       />

//       <Animated.Image
//         source={require('../assets/cloud.png')}
//         style={[styles.splash_Logo, {opacity: logoOpacity}]}
//         resizeMode="contain"
//       />

//       <Animated.Text style={[styles.splash_Text, {opacity: textOpacity}]}>
//         IDAP360
//       </Animated.Text>

//       <Animated.Text style={[styles.splash_Tagline, {opacity: taglineOpacity}]}>
//         معمارِ پنجاب
//       </Animated.Text>
//     </ImageBackground>
//   );
// };

// export default SplashScreens;
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ImageBackground} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {setSkipLoginAfterRestart} from '../store/slices/languageSlice';
import {jwtDecode} from 'jwt-decode';
import {
  fetchUserInfo,
  fetchEmployeeLegalEntities,
  fetchEmployeeMenuItems,
} from '../Controller/authUtils';
import {setUserData} from '../store/slices/userSlice';
import {
  initializeLegalEntity,
  setLegalEntities,
} from '../store/slices/companySlice';
import {setMenuItems} from '../store/slices/menuItemSlice';
import {setFirebaseUserData} from '../store/slices/firebaseSlice';
import styles from '../styles/styles';

const SplashScreens = ({navigation}) => {
  const dispatch = useDispatch();
  const skipLogin = useSelector(state => state.language.skipLoginAfterRestart);
  const accessToken = useSelector(state => state.auth.accessToken);
  const idToken = useSelector(state => state.auth.idToken);
  const userToken = useSelector(state => state.auth.userToken);
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  const userData = useSelector(state => state.user.userData);
  const menuItems = useSelector(state => state.menuItem.menuItems);
  const company = useSelector(state => state.company);
  const didBootstrapRef = useRef(false);
  const loginTimeoutRef = useRef(null);
  const drawerTimeoutRef = useRef(null);
  const waitForSessionTimeoutRef = useRef(null);

  // Animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const circlePulse1 = useRef(new Animated.Value(0)).current;
  const circlePulse2 = useRef(new Animated.Value(0)).current;
  const circlePulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeInContent = () => {
      // Staggered fade in for text
      Animated.stagger(300, [
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Staggered circle animations
    Animated.stagger(400, [
      Animated.timing(circlePulse1, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(circlePulse2, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(circlePulse3, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const clearPendingNavigation = () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      if (drawerTimeoutRef.current) {
        clearTimeout(drawerTimeoutRef.current);
        drawerTimeoutRef.current = null;
      }
      if (waitForSessionTimeoutRef.current) {
        clearTimeout(waitForSessionTimeoutRef.current);
        waitForSessionTimeoutRef.current = null;
      }
    };

    const checkAuthStatus = () => {
      try {
        fadeInContent();

        // Wait until redux-persist finishes rehydration; otherwise tokens/flags may
        // not be available yet (common after RTL restart).
        if (!rehydrated) {
          return;
        }

        clearPendingNavigation();

        const hasSession = Boolean(
          accessToken || idToken || userToken || userData?.employeeId,
        );

        console.log('Splash auth check:', {
          rehydrated,
          skipLogin,
          hasSession,
          hasAccessToken: Boolean(accessToken),
          hasIdToken: Boolean(idToken),
          hasUserToken: Boolean(userToken),
          hasUserData: Boolean(userData?.employeeId),
        });

        const bootstrapSessionIfNeeded = async () => {
          if (!hasSession) {
            return;
          }
          if (didBootstrapRef.current) {
            return;
          }

          const missingUser = !userData?.employeeId;
          const missingMenus =
            !Array.isArray(menuItems) || menuItems.length === 0;
          const missingCompany =
            !company?.selectedLegalEntity ||
            !Array.isArray(company?.legalEntities) ||
            company.legalEntities.length === 0;

          if (!missingUser && !missingMenus && !missingCompany) {
            return;
          }

          didBootstrapRef.current = true;

          try {
            const token = accessToken || idToken || userToken;
            const decoded = jwtDecode(token);
            const email = decoded?.upn || decoded?.email;

            if (!email) {
              return;
            }

            const userInfo = await fetchUserInfo(email);
            if (!userInfo.length || !userInfo[0]?.EmployeeId) {
              return;
            }

            const user = userInfo[0];
            const completeUserData = {
              userName: decoded?.name || user.EmployeeName,
              employeeName: user.EmployeeName,
              employeeId: user.EmployeeId,
              WorkerRecId: user.WorkerRecId,
              email: email,
              jobId: user.JobId,
              department: user.Department,
              defaultLegalEntity: user.DefaultLegalEntity,
              PositionDescription: user.PositionDescription,
              CreatedBy: user.CreatedBy,
              CreatedDateTime: user.CreatedDateTime,
              DataAreaId: user.DataAreaId,
              IsEnrolledInPayroll: user.IsEnrolledInPayroll,
              JobDescription: user.JobDescription,
              ModifiedBy: user.ModifiedBy,
              ModifiedDateTime: user.ModifiedDateTime,
              OriginalHireDate: user.OriginalHireDate,
              Partition: user.Partition,
              Person: user.Person,
              Positionid: user.Positionid,
              RecId: user.RecId,
              isDynamicsUser: user.isDynamicsUser,
              employeeFullInfo: user,
            };

            dispatch(setUserData(completeUserData));
            dispatch(initializeLegalEntity(user.DefaultLegalEntity));

            const [legalEntities, menus] = await Promise.all([
              fetchEmployeeLegalEntities(user.EmployeeId),
              fetchEmployeeMenuItems(user.Person),
            ]);

            if (Array.isArray(legalEntities)) {
              dispatch(setLegalEntities(legalEntities));
            }
            if (Array.isArray(menus)) {
              dispatch(setMenuItems(menus));
            }

            dispatch(
              setFirebaseUserData({
                userEmail: email,
                employeeId: user.EmployeeId,
                company: user.DefaultLegalEntity,
              }),
            );
          } catch (e) {
            console.log('Splash session bootstrap error:', e);
          }
        };

        if (skipLogin) {
          if (hasSession) {
            // Only skip Login during the language-change restart case
            drawerTimeoutRef.current = setTimeout(() => {
              dispatch(setSkipLoginAfterRestart(false));
              Promise.resolve(bootstrapSessionIfNeeded()).finally(() => {
                navigation.replace('DrawerNavigator');
              });
            }, 2000);
            return;
          }

          // Language restart was requested, but session data hasn't rehydrated yet.
          // Wait a bit instead of routing to Login immediately.
          console.log('Splash waiting for session after language restart...');
          waitForSessionTimeoutRef.current = setTimeout(() => {
            console.log(
              'Splash wait expired; sending user to Login (no session after restart)',
            );
            dispatch(setSkipLoginAfterRestart(false));
            navigation.replace('Login');
          }, 4000);
          return;
        }

        // Normal flow - go to Login
        loginTimeoutRef.current = setTimeout(() => {
          navigation.replace('Login');
        }, 3000);
      } catch (error) {
        console.log('Splash screen error:', error);
        navigation.replace('Login');
      }
    };

    checkAuthStatus();

    return () => {
      clearPendingNavigation();
    };
  }, [
    navigation,
    textOpacity,
    taglineOpacity,
    circlePulse1,
    circlePulse2,
    circlePulse3,
    skipLogin,
    accessToken,
    idToken,
    userToken,
    rehydrated,
    userData?.employeeId,
    menuItems,
    company.selectedLegalEntity,
    company.legalEntities,
    dispatch,
  ]);

  // Circle scale interpolations
  const circle1Scale = circlePulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle2Scale = circlePulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle3Scale = circlePulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle1Opacity = circlePulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const circle2Opacity = circlePulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.1],
  });

  const circle3Opacity = circlePulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
  });

  return (
    <ImageBackground
      source={require('../assets/IDAPSplash.png')}
      style={styles.splash_Container}
      resizeMode="cover">
      {/* Background Circles */}
      <Animated.View
        style={[
          styles.splash_Circle1,
          {opacity: circle1Opacity, transform: [{scale: circle1Scale}]},
        ]}
      />
      <Animated.View
        style={[
          styles.splash_Circle2,
          {opacity: circle2Opacity, transform: [{scale: circle2Scale}]},
        ]}
      />
      <Animated.View
        style={[
          styles.splash_Circle3,
          {opacity: circle3Opacity, transform: [{scale: circle3Scale}]},
        ]}
      />
    </ImageBackground>
  );
};

export default SplashScreens;
