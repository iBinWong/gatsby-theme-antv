import React, { useState } from 'react';
import { graphql, Link } from 'gatsby';
import { Layout as AntLayout, Menu, Icon, Tooltip } from 'antd';
import { groupBy } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import Article from '../components/Article';
import SEO from '../components/Seo';
import Tabs from '../components/Tabs';
import PlayGrounds from '../components/PlayGrounds';
import styles from './markdown.module.less';

const MenuIcon = Icon.createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_470089_9m0keqj54r.js', // generated by iconfont.cn
});

const renderMenuItems = (edges: any[]) =>
  edges
    .filter((edge: any) => {
      const {
        node: {
          fields: { slug },
        },
      } = edge;
      if (slug.endsWith('/API') || slug.endsWith('/design')) {
        return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const {
        node: {
          frontmatter: { order: aOrder },
        },
      } = a;
      const {
        node: {
          frontmatter: { order: bOrder },
        },
      } = b;
      return aOrder - bOrder;
    })
    .map((edge: any) => {
      const {
        node: {
          frontmatter: { title, icon },
          fields: { slug },
        },
      } = edge;
      return (
        <Menu.Item key={slug}>
          <Link to={slug}>
            {icon && (
              <MenuIcon className={styles.menuIcon} type={`icon-${icon}`} />
            )}
            <span>{title}</span>
          </Link>
        </Menu.Item>
      );
    });

const getMenuItemLocaleKey = (slug: string = '') => {
  const slugPieces = slug.split('/');
  const menuItemLocaleKey = slugPieces
    .slice(slugPieces.indexOf('examples'))
    .filter(key => key)
    .join('/');
  return menuItemLocaleKey;
};

const getExampleOrder = ({
  groupedEdgeKey = '',
  examples = [],
  groupedEdges = {},
}: {
  groupedEdgeKey: string;
  examples: any[];
  groupedEdges: {
    [key: string]: any[];
  };
}): number => {
  const key = getMenuItemLocaleKey(groupedEdgeKey);
  if (examples.find(item => item.slug === key)) {
    return (examples.findIndex(item => item.slug === key) || 0) + 100;
  }
  if (!groupedEdges[groupedEdgeKey] && !groupedEdges[groupedEdgeKey].length) {
    return 0;
  }
  return groupedEdges[groupedEdgeKey][0].node.frontmatter.order || 0;
};

export default function Template({
  data, // this prop will be injected by the GraphQL query below.
  location,
  pageContext,
}: {
  data: any;
  location: Location;
  pageContext: {
    prev: any;
    next: any;
    exampleSections: any;
  };
}) {
  const { allMarkdownRemark, site } = data; // data.markdownRemark holds our post data
  const { edges = [] } = allMarkdownRemark;
  const edgesInExamples = edges.filter((item: any) =>
    item.node.fields.slug.includes('/examples/'),
  );
  const { node: markdownRemark } = edgesInExamples.find((edge: any) => {
    const {
      fields: { slug },
    } = edge.node;
    if (
      /\/examples\/.*\/API$/.test(location.pathname) ||
      /\/examples\/.*\/design$/.test(location.pathname)
    ) {
      return location.pathname.indexOf(slug) >= 0;
    }
    return location.pathname === slug || location.pathname.endsWith(slug);
  });
  const {
    frontmatter,
    html,
    fields: { slug },
    parent: { relativePath },
  } = markdownRemark;
  const {
    siteMetadata: { examples, githubUrl },
  } = site;
  const { t, i18n } = useTranslation();
  const groupedEdges = groupBy(
    edgesInExamples,
    ({
      node: {
        fields: { slug },
      },
    }: any) => {
      // API.md and deisgn.md
      if (slug.endsWith('/API') || slug.endsWith('/design')) {
        return slug
          .split('/')
          .slice(0, -2)
          .join('/');
      }
      // index.md
      return slug
        .split('/')
        .slice(0, -1)
        .join('/');
    },
  );
  const defaultOpenKeys = Object.keys(groupedEdges).filter(key =>
    slug.startsWith(key),
  );
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);
  let activeTab = 'examples' as 'examples' | 'API' | 'design';
  let exampleRootSlug = slug;
  if (/\/examples\/.*\/API$/.test(location.pathname)) {
    activeTab = 'API';
    exampleRootSlug = exampleRootSlug.replace(/\/API$/, '');
  } else if (/\/examples\/.*\/design$/.test(location.pathname)) {
    activeTab = 'design';
    exampleRootSlug = exampleRootSlug.replace(/\/design$/, '');
  }
  const { exampleSections } = pageContext;
  return (
    <>
      <SEO title={frontmatter.title} lang={i18n.language} />
      <AntLayout
        style={{ background: '#fff' }}
        hasSider
        className={styles.layout}
      >
        <AntLayout.Sider width="auto" theme="light" className={styles.sider}>
          <Menu
            mode="inline"
            selectedKeys={[slug]}
            style={{ height: '100%' }}
            openKeys={openKeys}
            onOpenChange={openKeys => setOpenKeys(openKeys)}
          >
            {Object.keys(groupedEdges)
              .filter(key => key.startsWith(`/${i18n.language}/`))
              .sort((a: string, b: string) => {
                const aOrder = getExampleOrder({
                  groupedEdgeKey: a,
                  examples,
                  groupedEdges,
                });
                const bOrder = getExampleOrder({
                  groupedEdgeKey: b,
                  examples,
                  groupedEdges,
                });
                return aOrder - bOrder;
              })
              .map(slug => {
                const slugPieces = slug.split('/');
                if (slugPieces.length <= 3) {
                  return renderMenuItems(groupedEdges[slug]);
                } else {
                  const menuItemLocaleKey = getMenuItemLocaleKey(slug);
                  const doc =
                    examples.find(
                      (doc: any) => doc.slug === menuItemLocaleKey,
                    ) || {};
                  return (
                    <Menu.SubMenu
                      key={slug}
                      title={
                        <div>
                          {doc.icon && (
                            <MenuIcon
                              className={styles.menuIcon}
                              type={`icon-${doc.icon}`}
                            />
                          )}
                          <span>
                            {doc && doc.title
                              ? doc.title[i18n.language]
                              : menuItemLocaleKey}
                          </span>
                        </div>
                      }
                    >
                      {renderMenuItems(groupedEdges[slug])}
                    </Menu.SubMenu>
                  );
                }
              })}
          </Menu>
        </AntLayout.Sider>
        <Article className={styles.markdown}>
          <div className={styles.main} style={{ width: '100%' }}>
            <h1>
              {frontmatter.title}
              <Tooltip title={t('在 GitHub 上编辑')}>
                <a
                  href={`${githubUrl}/edit/master/${relativePath}`}
                  target="_blank"
                  className={styles.editOnGtiHubButton}
                >
                  <Icon type="edit" />
                </a>
              </Tooltip>
            </h1>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <Tabs slug={exampleRootSlug} active={activeTab} />
            {exampleSections.examples && (
              <div
                style={{ display: activeTab === 'examples' ? 'block' : 'none' }}
              >
                <PlayGrounds
                  examples={exampleSections.examples}
                  location={location}
                />
              </div>
            )}
            {exampleSections.API && (
              <div
                style={{ display: activeTab === 'API' ? 'block' : 'none' }}
                dangerouslySetInnerHTML={{
                  __html: exampleSections.API.node.html,
                }}
              />
            )}
            {exampleSections.design && (
              <div
                style={{ display: activeTab === 'design' ? 'block' : 'none' }}
                dangerouslySetInnerHTML={{
                  __html: exampleSections.design.node.html,
                }}
              />
            )}
          </div>
        </Article>
      </AntLayout>
    </>
  );
}

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
        githubUrl
        examples {
          slug
          icon
          title {
            zh
            en
          }
        }
      }
      pathPrefix
    }
    allMarkdownRemark(
      sort: { order: ASC, fields: [frontmatter___order] }
      limit: 1000
    ) {
      edges {
        node {
          html
          fields {
            slug
          }
          frontmatter {
            title
            icon
            order
          }
          parent {
            ... on File {
              relativePath
            }
          }
        }
      }
    }
  }
`;
