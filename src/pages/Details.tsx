import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonProgressBar,
  IonRefresher,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/react';
import { refresh } from 'ionicons/icons';
import React, { useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';

import DeleteItem from '../components/kubernetes/DeleteItem';
import EditItem from '../components/kubernetes/EditItem';
import LoadingErrorCard from '../components/misc/LoadingErrorCard';
import { AppContext } from '../context';
import { IContext } from '../declarations';
import { sections } from '../sections';

interface IMatchParams {
  section: string;
  type: string;
  namespace: string;
  name: string;
}

interface IDetailsProps extends RouteComponentProps<IMatchParams> {}

const Details: React.FunctionComponent<IDetailsProps> = ({ match }) => {
  const context = useContext<IContext>(AppContext);

  const page = sections[match.params.section].pages[match.params.type];
  const Component = page.detailsComponent;

  const [error, setError] = useState<string>('');
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [item, setItem] = useState<any>();
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    (async() => {
      setItem(undefined);
      setUrl(match.url);
      await load();
    })();

    return () => {};
  }, [match]); /* eslint-disable-line */

  const doRefresh = async (event) => {
    event.detail.complete();
    await load();
  };

  const load = async () => {
    setShowLoading(true);

    try {
      const data: any = await context.request('GET', page.detailsURL(match.params.namespace, match.params.name), '');
      setError('');
      setItem(data);
    } catch (err) {
      setError(err.message);
    }

    setShowLoading(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/kubernetes/${match.params.section}/${match.params.type}`} />
          </IonButtons>
          <IonTitle>{item && item.metadata ? item.metadata.name : ''}</IonTitle>
          {!isPlatform('hybrid') ? (
            <IonButtons slot="primary">
              <IonButton onClick={() => load()}>
                <IonIcon slot="icon-only" icon={refresh} />
              </IonButton>
              {item ? <EditItem activator="button" item={item} url={page.detailsURL(item.metadata ? item.metadata.namespace : '', item.metadata ? item.metadata.name : '')} /> : null}
              {item ? <DeleteItem activator="button" item={item} url={page.detailsURL(item.metadata ? item.metadata.namespace : '', item.metadata ? item.metadata.name : '')} /> : null}
            </IonButtons>
          ) : null}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {showLoading ? <IonProgressBar slot="fixed" type="indeterminate" color="primary" /> : null}
        <IonRefresher slot="fixed"  onIonRefresh={doRefresh} />

        {error === '' && context.clusters && context.cluster && context.clusters.hasOwnProperty(context.cluster) && match.url === url && item ? (
          <Component item={item} section={match.params.section} type={match.params.type} />
        ) : <LoadingErrorCard error={error} exists={context.clusters && context.cluster && context.clusters.hasOwnProperty(context.cluster) ? true  : false} icon={page.icon} text={`Could not get ${page.pluralText}`} />}
      </IonContent>
    </IonPage>
  );
};

export default Details;
