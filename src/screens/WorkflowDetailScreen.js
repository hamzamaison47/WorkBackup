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
import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
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

const COLORS = {
  primary: '#1E40AF',
  primaryLight: '#EFF3FB',
  text: '#1F2937',
  subtext: '#6B7280',
  border: '#E5E7EB',
  cardBg: '#FFFFFF',
  screenBg: '#F5F6F8',
  danger: '#B91C1C',
  dangerBg: '#FEF2F2',
};

const WorkflowDetailScreen = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [hasError, setHasError] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const {contextRecId, tableId} = route.params ?? {};
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();

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
      const sanitizedHtml = decodedHtml.replace(
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        '',
      );

      setHtmlContent(sanitizedHtml?.trim() ? sanitizedHtml : '');
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
      pageTitle="Request Details"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={fetchHtmlContent}>
      <View style={styles.screen}>{renderBody()}</View>
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  baseHtml: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
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
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: 13.5,
    color: COLORS.subtext,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  errorBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBadgeText: {
    color: COLORS.danger,
    fontSize: 20,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBg,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

const tagsStyles = {
  h1: {fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 10},
  h2: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 10,
  },
  h3: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  p: {marginBottom: 10, color: COLORS.text},
  a: {color: COLORS.primary, textDecorationLine: 'underline'},
  strong: {fontWeight: '700'},
  ul: {marginBottom: 10},
  ol: {marginBottom: 10},
  li: {marginBottom: 4},
  hr: {borderColor: COLORS.border, marginVertical: 12},
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },
  thead: {backgroundColor: COLORS.primaryLight},
  th: {fontWeight: '600', color: COLORS.primary, padding: 8, fontSize: 13.5},
  td: {
    padding: 8,
    fontSize: 13.5,
    color: COLORS.text,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tr: {borderBottomWidth: 1, borderBottomColor: COLORS.border},
};

const classesStyles = {
  label: {
    fontSize: 12,
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {fontSize: 14.5, color: COLORS.text, fontWeight: '500'},
};

export default WorkflowDetailScreen;
