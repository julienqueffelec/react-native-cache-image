import React, { useCallback, useEffect, useState } from 'react';
import type { ImageStyle, ImageURISource, StyleProp } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

import type { DownloadFileOptions } from 'react-native-fs';
import RNFS, { DocumentDirectoryPath } from 'react-native-fs';

const SHA1 = require('crypto-js/sha1');

interface Props {
  source: ImageURISource;
  style?: StyleProp<ImageStyle>;
  needRefresh?: boolean;
}

const styles = StyleSheet.create({
  default: { height: 50, width: 50 },
  fail: { height: 60, width: 50 },
  imageStyle: {
    height: 150,
    width: 150,
  },
});

export const SmartImage: React.FC<Props> = ({ source, style }) => {
  const [failToLoad, setFailToLoad] = useState(false);
  const [localSource, setLocalSource] = useState<ImageURISource>({ uri: '' });
  const [loadSuccess, setLoadSuccess] = useState(false);
  const loadSuccessOfImage = useCallback((imageCachePath: string) => {
    setLocalSource({ uri: imageCachePath });
    setFailToLoad(false);
    setLoadSuccess(true);
  }, []);

  const loadFailureOfImage = () => {
    setFailToLoad(true);
    setLoadSuccess(false);
  };

  const performImageStoreAction = () => {
    const filename = source?.uri?.replace(/^.*[\\\\/]/, '');
    const imageCachePath = `file://${RNFS.CachesDirectoryPath}${filename}`;
    const options: DownloadFileOptions = {
      fromUrl: source?.uri ? String(source.uri) : '',
      toFile: imageCachePath,
    };

    RNFS.exists(imageCachePath)
      .then((isImageExist: boolean) => {
        if (isImageExist) {
          loadSuccessOfImage(imageCachePath);
        } else {
          RNFS.downloadFile(options)
            .promise.then(() => {
              loadSuccessOfImage(imageCachePath);
            })
            .catch(() => {
              loadFailureOfImage();
            });
        }
      })
      .catch(() => {
        loadFailureOfImage();
      });
  };

  const checkForImageLocalPathNew = () => {
    if (source?.uri) {
      setLoadSuccess(false);

      const url = source.uri;
      const type = url?.replace(/.*\.(.*)/, '$1');
      const cacheKey = `${SHA1(url)}.${type}`;
      const dirPath = DocumentDirectoryPath;
      const filePath = `${dirPath}/${cacheKey}`;

      RNFS.exists(filePath)
        .then((res: boolean) => {
          if (res) {
            performImageStoreAction();
          } else {
            RNFS.mkdir(dirPath)
              .then(() => {
                performImageStoreAction();
              })
              .catch(() => {
                loadFailureOfImage();
              });
          }
        })
        .catch(() => {
          loadFailureOfImage();
        });
    } else {
      loadFailureOfImage();
    }
  };

  useEffect(() => {
    checkForImageLocalPathNew();
  }, [source]);

  const renderImageView = () => {
    if (failToLoad) {
      return <View style={styles.fail} />;
    } else if (loadSuccess) {
      return (
        <Image
          source={localSource}
          resizeMode="cover"
          onError={() => {
            loadFailureOfImage();
          }}
          style={style || [styles.imageStyle, style]}
        />
      );
    }

    return <View style={styles.default} />;
  };

  return renderImageView();
};
