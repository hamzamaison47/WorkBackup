import React, {useState, useCallback} from 'react';
import {ScrollView, Text, useWindowDimensions} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import ActionPaneContainer from '../components/ActionPaneContainer';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import RenderHtml from 'react-native-render-html';
import {decode} from 'html-entities';
import getWFRecordDetailHTMLResponse from '../API/WorkflowTrackingStatusTable/getWFRecordDetailHTMLResponse';

const WorkflowDetailScreen = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);

  const route = useRoute();
  const {contextRecId, tableId} = route.params ?? {};
  const {width} = useWindowDimensions();

  const fetchHtmlContent = useCallback(async () => {
    setIsLoadingHtml(true);
    try {
      const responseHtml = await getWFRecordDetailHTMLResponse({
        contextRecId,
        tableId,
      });

      // 1️⃣ Decode HTML entities
      const decodedHtml = decode(responseHtml || '');
      // 2️⃣ Remove any <script> tags
      const sanitizedHtml = decodedHtml.replace(
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        '',
      );

      setHtmlContent(sanitizedHtml || '<p>No content available</p>');
    } catch (error) {
      console.log('Failed to fetch HTML:', error);
      setHtmlContent('<p>Failed to load content</p>');
    } finally {
      setIsLoadingHtml(false);
    }
  }, [contextRecId, tableId]);

  useFocusEffect(
    useCallback(() => {
      fetchHtmlContent();
    }, [fetchHtmlContent]),
  );

  return (
    <ActionPaneContainer
      pageTitle="Request Details"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={fetchHtmlContent}>
      {isLoadingHtml ? (
        <CustomIndicator />
      ) : htmlContent ? (
        <ScrollView contentContainerStyle={{padding: 16, flexGrow: 1}}>
          <RenderHtml
            contentWidth={width}
            source={{html: htmlContent}}
            baseStyle={{fontSize: 16, color: '#000'}}
            tagsStyles={{
              table: {borderWidth: 1, borderColor: '#000', marginVertical: 8},
              th: {fontWeight: 'bold', padding: 4},
              td: {padding: 4},
              h2: {color: '#1E40AF', marginBottom: 12},
            }}
          />
        </ScrollView>
      ) : (
        <Text>No content available</Text>
      )}
    </ActionPaneContainer>
  );
};

export default WorkflowDetailScreen;
