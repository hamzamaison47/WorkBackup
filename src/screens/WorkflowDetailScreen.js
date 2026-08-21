// import React, {useState, useCallback} from 'react';
// import {ScrollView, Text, useWindowDimensions} from 'react-native';
// import {useRoute, useFocusEffect} from '@react-navigation/native';
// import ActionPaneContainer from '../components/ActionPaneContainer';
// import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
// import RenderHtml from 'react-native-render-html';
// import {decode} from 'html-entities';
// import getWFRecordDetailHTMLResponse from '../API/WorkflowTrackingStatusTable/getWFRecordDetailHTMLResponse';

// const WorkflowDetailScreen = () => {
//   const [htmlContent, setHtmlContent] = useState('');
//   const [isLoadingHtml, setIsLoadingHtml] = useState(false);

//   const route = useRoute();
//   const {contextRecId, tableId} = route.params ?? {};
//   const {width} = useWindowDimensions();

//   const fetchHtmlContent = useCallback(async () => {
//     setIsLoadingHtml(true);
//     try {
//       const responseHtml = await getWFRecordDetailHTMLResponse({
//         contextRecId,
//         tableId,
//       });

//       // 1️⃣ Decode HTML entities
//       const decodedHtml = decode(responseHtml || '');
//       // 2️⃣ Remove any <script> tags
//       const sanitizedHtml = decodedHtml.replace(
//         /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
//         '',
//       );

//       setHtmlContent(sanitizedHtml || '<p>No content available</p>');
//     } catch (error) {
//       console.log('Failed to fetch HTML:', error);
//       setHtmlContent('<p>Failed to load content</p>');
//     } finally {
//       setIsLoadingHtml(false);
//     }
//   }, [contextRecId, tableId]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchHtmlContent();
//     }, [fetchHtmlContent]),
//   );

//   return (
//     <ActionPaneContainer
//       pageTitle="Request Details"
//       isBackButton={true}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       showTabNavigator={false}
//       onRefresh={fetchHtmlContent}>
//       {isLoadingHtml ? (
//         <CustomIndicator />
//       ) : htmlContent ? (
//         <ScrollView contentContainerStyle={{padding: 16, flexGrow: 1}}>
//           <RenderHtml
//             contentWidth={width}
//             source={{html: htmlContent}}
//             baseStyle={{fontSize: 16, color: '#000'}}
//             tagsStyles={{
//               table: {borderWidth: 1, borderColor: '#000', marginVertical: 8},
//               th: {fontWeight: 'bold', padding: 4},
//               td: {padding: 4},
//               h2: {color: '#1E40AF', marginBottom: 12},
//             }}
//           />
//         </ScrollView>
//       ) : (
//         <Text>No content available</Text>
//       )}
//     </ActionPaneContainer>
//   );
// };

// export default WorkflowDetailScreen;
import React, {useState, useCallback, useMemo} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ActionPaneContainer from '../components/ActionPaneContainer';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import RenderHtml from 'react-native-render-html';
import {decode} from 'html-entities';
import getWFRecordDetailHTMLResponse from '../API/WorkflowTrackingStatusTable/getWFRecordDetailHTMLResponse';
import useAppTokens from '../components/AppComponentsDesign/useAppTokens';

// The HTML this screen renders comes straight from an X++/D365 template
// (getWFRecordDetailHTMLResponse), which bakes in its own inline
// border/background colors on <table>/<td> etc. react-native-render-html
// gives inline styles priority over tagsStyles/classesStyles, so those
// hardcoded colors (e.g. a white border) win over our theme tokens
// regardless of dark mode. Stripping just the border*/background*
// declarations out of any inline style="" attribute lets the
// theme-aware tagsStyles (T.cardDivider, etc.) apply instead — everything
// else the template sets inline (alignment, width, padding...) is left
// untouched.
const STRIPPED_INLINE_PROPS = new Set([
  'border',
  'border-color',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'background',
  'background-color',
]);

const stripInlineBorderAndBackground = html => {
  if (!html) return html;
  return (
    html
      .replace(/style\s*=\s*"([^"]*)"/gi, (match, styleContent) => {
        const cleaned = styleContent
          .split(';')
          .filter(decl => {
            const prop = decl.split(':')[0]?.trim().toLowerCase();
            return prop && !STRIPPED_INLINE_PROPS.has(prop);
          })
          .join(';')
          .trim();
        return cleaned ? `style="${cleaned}"` : '';
      })
      // Legacy HTML attributes some D365 templates emit instead of CSS.
      .replace(/\s+(bordercolor|bgcolor)\s*=\s*"[^"]*"/gi, '')
  );
};

// Same createStyles(T) pattern used across the app's dark-mode-migrated
// screens — called inside the component with the live tokens so styles
// recompute on theme change instead of being frozen at module load.
// Token names confirmed against Tokens.js (LightTokens/DarkTokens/BrandTokens).
const createStyles = T =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: T.pageBg,
    },
    scrollContent: {
      padding: 16,
      flexGrow: 1,
    },
    card: {
      backgroundColor: T.cardBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: T.cardDivider,
      shadowColor: T.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    baseHtml: {
      fontSize: 15,
      lineHeight: 22,
      color: T.titleText,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    stateTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: T.titleText,
      marginTop: 12,
      textAlign: 'center',
    },
    stateSubtext: {
      fontSize: 13.5,
      color: T.subtitleText,
      marginTop: 6,
      textAlign: 'center',
      lineHeight: 19,
    },
    errorBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: T.redBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorBadgeText: {
      color: T.red,
      fontSize: 20,
      fontWeight: '700',
    },
    retryButton: {
      marginTop: 16,
      backgroundColor: T.blue,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: T.onPrimary ?? '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    backButton: {
      marginTop: 20,
      alignSelf: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: T.blue,
      backgroundColor: T.cardBg,
    },
    backButtonText: {
      color: T.blue,
      fontSize: 14,
      fontWeight: '600',
    },
  });

const createTagsStyles = T => ({
  h1: {
    fontSize: 20,
    fontWeight: '700',
    color: T.titleText,
    marginBottom: 10,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    color: T.blue,
    marginTop: 4,
    marginBottom: 10,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: T.titleText,
    marginBottom: 8,
  },
  p: {marginBottom: 10, color: T.titleText},
  a: {color: T.blue, textDecorationLine: 'underline'},
  strong: {fontWeight: '700'},
  ul: {marginBottom: 10},
  ol: {marginBottom: 10},
  li: {marginBottom: 4},
  hr: {borderColor: T.cardDivider, marginVertical: 12},
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: T.blue,
    backgroundColor: T.blueBg,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: T.cardDivider,
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },
  thead: {backgroundColor: T.cardHeadingBg},
  th: {
    fontWeight: '600',
    color: T.titleText,
    padding: 8,
    fontSize: 13.5,
  },
  td: {
    padding: 8,
    fontSize: 13.5,
    color: T.titleText,
    borderTopWidth: 1,
    borderTopColor: T.cardDivider,
  },
  tr: {borderBottomWidth: 1, borderBottomColor: T.rowDivider},
});

const createClassesStyles = T => ({
  label: {
    fontSize: 12,
    color: T.subtitleText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 14.5,
    color: T.titleText,
    fontWeight: '500',
  },
});

const WorkflowDetailScreen = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [hasError, setHasError] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const {contextRecId, tableId} = route.params ?? {};
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const T = useAppTokens();
  const styles = useMemo(() => createStyles(T), [T]);
  const tagsStyles = useMemo(() => createTagsStyles(T), [T]);
  const classesStyles = useMemo(() => createClassesStyles(T), [T]);

  const fetchHtmlContent = useCallback(async () => {
    setIsLoadingHtml(true);
    setHasError(false);
    try {
      const responseHtml = await getWFRecordDetailHTMLResponse({
        contextRecId,
        tableId,
      });
      console.log('Params received:', {
        tableId,
        contextRecId,
        typeofTableId: typeof tableId,
        typeofContextRecId: typeof contextRecId,
      });

      const decodedHtml = decode(responseHtml || '');
      const sanitizedHtml = decodedHtml
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(
          /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
          match =>
            // <style> blocks can also hardcode border/background colors that
            // beat tagsStyles the same way inline style="" does — strip the
            // whole block rather than trying to parse arbitrary CSS rules.
            '',
        );
      const themedHtml = stripInlineBorderAndBackground(sanitizedHtml);

      setHtmlContent(themedHtml?.trim() ? themedHtml : '');
    } catch (error) {
      console.log('Failed to fetch HTML:', error);
      setHasError(true);
      setHtmlContent('');
    } finally {
      setIsLoadingHtml(false);
    }
  }, [contextRecId, tableId]);

  useFocusEffect(
    useCallback(() => {
      fetchHtmlContent();
    }, [fetchHtmlContent]),
  );

  const handleGoBack = useCallback(() => {
    navigation.navigate('WorkItemsAssignedToMePage');
  }, [navigation]);

  // System/hardware back press (Android back button or gesture) should land
  // in the same place as the in-content "Back to Work Items" button and the
  // header back arrow — not the default navigation.goBack() stack pop.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [handleGoBack]),
  );

  const contentWidth = width - 32 - 32;

  const renderBody = () => {
    if (isLoadingHtml) {
      return (
        <View style={styles.centerState}>
          <CustomIndicator />
          <Text style={styles.stateSubtext}>Loading request details…</Text>
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.centerState}>
          <View style={styles.errorBadge}>
            <Text style={styles.errorBadgeText}>!</Text>
          </View>
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateSubtext}>
            We couldn't load the request details. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchHtmlContent}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Back to Work Items</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!htmlContent) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No details available</Text>
          <Text style={styles.stateSubtext}>
            There is no content to display for this request yet.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Back to Work Items</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <RenderHtml
            contentWidth={contentWidth}
            source={{html: htmlContent}}
            baseStyle={styles.baseHtml}
            tagsStyles={tagsStyles}
            classesStyles={classesStyles}
          />
        </View>

        {/* Back button at the end of the content */}
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Back to Work Items</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="WorkItem Request Details"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      showPageTitleRow={true}
      onBackPress={handleGoBack}
      onRefresh={fetchHtmlContent}>
      <View style={styles.screen}>{renderBody()}</View>
    </ActionPaneContainer>
  );
};

export default WorkflowDetailScreen;
