import Route from 'Common/Types/API/Route';
import Dictionary from 'Common/Types/Dictionary';
import PageMap from './PageMap';
import RouteParams from './RouteParams';
import ObjectID from 'Common/Types/ObjectID';

const RouteMap: Dictionary<Route> = {
    [PageMap.INIT]: new Route(`/admin-dashboard`),
};

export class RouteUtil {
    public static populateRouteParams(
        route: Route,
        props?: {
            modelId?: ObjectID;
            subModelId?: ObjectID;
        }
    ): Route {
        // populate projectid

        const tempRoute: Route = new Route(route.toString());

        if (props && props.modelId) {
            route = tempRoute.addRouteParam(
                RouteParams.ModelID,
                props.modelId.toString()
            );
        }

        if (props && props.subModelId) {
            route = tempRoute.addRouteParam(
                RouteParams.SubModelID,
                props.subModelId.toString()
            );
        }

        return tempRoute;
    }
}

export default RouteMap;
