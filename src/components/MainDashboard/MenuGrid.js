/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {View, Text, FlatList} from 'react-native';
import MenuCard from './MenuCard';
import {chunkArray} from '../../store/utils/helpers';
import styles from '../../styles/styles';

const MenuGrid = ({dynamicMenus, dimensions, onCardPress}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const {
    screenWidth,
    computedCardWidth,
    computedCardHeight,
    iconSize,
    GRID_GAP,
    numColumns,
    cardsPerPage,
  } = dimensions;

  const pages = chunkArray(dynamicMenus, cardsPerPage);

  const renderPage = ({item: pageCards}) => (
    <View style={[styles.MainDash_PageContainer, {width: screenWidth}]}>
      {pageCards.map((card, index) => (
        <View
          key={card.id}
          style={{
            width: computedCardWidth,
            marginRight: (index + 1) % numColumns === 0 ? 0 : GRID_GAP,
          }}>
          <MenuCard
            card={card}
            cardWidth={computedCardWidth}
            cardHeight={computedCardHeight}
            iconSize={iconSize}
            gridGap={GRID_GAP}
            onPress={() => onCardPress(card)}
          />
        </View>
      ))}
    </View>
  );

  if (dynamicMenus.length === 0) {
    return (
      <View style={styles.MainDash_NoMenuContainer}>
        <Text style={styles.MainDash_NoMenuText}>No available request</Text>
      </View>
    );
  }

  return (
    <View style={styles.MainDash_MainContent}>
      <Text style={styles.MainDash_SectionTitle}>
        What would you like to do?
      </Text>

      <FlatList
        data={pages}
        renderItem={renderPage}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentPage(page);
        }}
        scrollEventThrottle={16}
      />

      {/* Page Indicators */}
      {dynamicMenus.length > cardsPerPage && (
        <View style={styles.MainDash_IndicatorContainer}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.MainDash_IndicatorDot,
                currentPage !== index && styles.MainDash_IndicatorDotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default MenuGrid;
