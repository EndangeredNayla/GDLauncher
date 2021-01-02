/* eslint-disable */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import ReactHtmlParser from 'react-html-parser';
import { faExternalLinkAlt, faInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Checkbox, TextField, Cascader, Button, Input, Select } from 'antd';
import { transparentize } from 'polished';
import { getAddonDescription, getAddonFiles } from 'src/common/api';
import ModalWindow from 'src/renderer/common/components/ModalWindow';
import CloseButton from 'src/renderer/common/components/CloseButton';
import { formatDate, formatNumber, sortByDate } from 'src/common/utils';
import { CURSEFORGE_URL } from 'src/common/utils/constants';
import { closeModal } from 'src/renderer/common/reducers/modals/actions';

const AddInstance = ({ modpack, setStep }) => {
  const dispatch = useDispatch();
  const [description, setDescription] = useState(null);
  const [files, setFiles] = useState(null);
  const [selectedId, setSelectedId] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        getAddonDescription(modpack.id).then(data => {
          // Replace the beginning of all relative URLs with the Curseforge URL
          const modifiedData = data.data.replace(
            /href="(?!http)/g,
            `href="${CURSEFORGE_URL}`
          );

          setDescription(modifiedData);
        }),
        getAddonFiles(modpack.id).then(async data => {
          const sortedFiles = data.data.sort(sortByDate);
          setFiles(sortedFiles);
          setLoading(false);
        })
      ]);
    };
    init();
  }, []);

  const handleChange = value => setSelectedId(value);

  const getReleaseType = id => {
    switch (id) {
      case 1:
        return (
          <span
            css={`
              color: ${props => props.theme.palette.colors.green};
            `}
          >
            [Stable]
          </span>
        );
      case 2:
        return (
          <span
            css={`
              color: ${props => props.theme.palette.colors.yellow};
            `}
          >
            [Beta]
          </span>
        );
      case 3:
      default:
        return (
          <span
            css={`
              color: ${props => props.theme.palette.colors.red};
            `}
          >
            [Alpha]
          </span>
        );
    }
  };

  const primaryImage = modpack.attachments.find(v => v.isDefault);
  return (
    <ModalWindow
      css={`
        height: 85%;
        width: 85%;
        max-width: 1500px;
      `}
      header={false}
    >
      <>
        <StyledCloseButton>
          <CloseButton onClick={() => dispatch(closeModal())} />
        </StyledCloseButton>
        <Container>
          <Parallax bg={primaryImage.thumbnailUrl}>
            <ParallaxContent>
              <ParallaxInnerContent>
                {modpack.name}
                <ParallaxContentInfos>
                  <div>
                    <label>Author: </label>
                    {modpack.authors[0].name}
                  </div>
                  <div>
                    <label>Downloads: </label>
                    {formatNumber(modpack.downloadCount)}
                  </div>
                  <div>
                    <label>Last Update: </label>
                    {formatDate(modpack.dateModified)}
                  </div>
                  <div>
                    <label>MC version: </label>
                    {modpack.gameVersionLatestFiles[0].gameVersion}
                  </div>
                </ParallaxContentInfos>
                <Button
                  href={modpack.websiteUrl}
                  css={`
                    position: absolute !important; 
                    top: 20px !important;
                    left: 20px !important;
                    width: 30px !important;
                    height: 30px !important;
                    display: flex !important;
                    justify-content: center !important;
                  `}
                  type="primary"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => {
                    dispatch(
                      openModal('ModChangelog', {
                        modpackId: modpack.id,
                        files
                      })
                    );
                  }}
                  css={`
                    position: absolute !important;
                    top: 20px !important;
                    left: 60px !important;
                    width: 30px !important;
                    height: 30px !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                  `}
                  type="primary"
                >
                  <FontAwesomeIcon icon={faInfo} />
                </Button>
              </ParallaxInnerContent>
            </ParallaxContent>
          </Parallax>
          <Content>{ReactHtmlParser(description)}</Content>
        </Container>
        <Footer>
          <div
            css={`
              flex: 1;
              display: flex;
              justify-content: center;
            `}
          >
            <StyledSelect
              placeholder={loading ? 'Loading Versions' : 'Select a version'}
              onChange={handleChange}
              listItemHeight={50}
              listHeight={400}
              loading={loading}
              disabled={loading}
            >
              {(files || []).map(file => (
                <Select.Option
                  title={file.displayName}
                  key={file.id}
                  value={file.id}
                >
                  <div
                    css={`
                      display: flex;
                      height: 50px;
                    `}
                  >
                    <div
                      css={`
                        flex: 7;
                        display: flex;
                        align-items: center;
                      `}
                    >
                      {file.displayName}
                    </div>
                    <div
                      css={`
                        flex: 2;
                        display: flex;
                        align-items: center;
                        flex-direction: column;
                      `}
                    >
                      <div>{file.gameVersion[0]}</div>
                      <div>{getReleaseType(file.releaseType)}</div>
                    </div>
                    <div
                      css={`
                        flex: 3;
                        display: flex;
                        align-items: center;
                      `}
                    >
                      <div>
                        {new Date(file.fileDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </StyledSelect>
          </div>
          <Button
            type="primary"
            disabled={!selectedId}
            onClick={() => {
              const modpackFile = files.find(file => file.id === selectedId);
              dispatch(closeModal());
              setStep(1);
            }}
          >
            Download
          </Button>
        </Footer>
      </>
    </ModalWindow>
  );
};

export default React.memo(AddInstance);

const StyledSelect = styled(Select)`
  width: 650px;
  height: 50px;
  .ant-select-selection-placeholder {
    height: 50px !important;
    line-height: 50px !important;
  }
  .ant-select-selector {
    height: 50px !important;
    cursor: pointer !important;
  }
  .ant-select-selection-item {
    flex: 1;
    cursor: pointer;
    & > div {
      & > div:nth-child(2) {
        & > div:last-child {
          height: 10px;
          line-height: 5px;
        }
      }
    }
  }
`;

const StyledCloseButton = styled.div`
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 1;
`;

const Container = styled.div`
  perspective: 1px;
  transform-style: preserve-3d;
  height: calc(100% - 70px);
  width: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
`;

const Parallax = styled.div`
  display: flex;
  flex: 1 0 auto;
  position: relative;
  height: 100%;
  width: 100%;
  transform: translateZ(-1px) scale(2);
  z-index: -1;
  background: url('${props => props.bg}');
  background-repeat: no-repeat;
  background-size: cover;
`;

const ParallaxInnerContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  a {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    width: 30px;
    height: 30px;
  }
`;

const ParallaxContent = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 60px;
  text-align: center;
  background: rgba(0, 0, 0, 0.8);
`;

const ParallaxContentInfos = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: normal;
  font-size: 12px;
  position: absolute;
  bottom: 40px;
  div {
    margin: 0 5px;
    label {
      font-weight: bold;
    }
  }
`;

const Content = styled.div`
  min-height: 100%;
  height: auto;
  display: block;
  padding: 30px 30px 90px 30px;
  font-size: 18px;
  position: relative;
  p {
    text-align: center;
  }
  img {
    max-width: 100%;
    height: auto;
  }
  z-index: 1;
  backdrop-filter: blur(20px);
  background: ${props => transparentize(0.4, props.theme.palette.grey[900])};
`;

const Footer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  bottom: 0;
  left: 0;
  height: 70px;
  width: 100%;
  background: ${props => props.theme.palette.grey[700]};
  && > * {
    margin: 0 10px;
  }
`;