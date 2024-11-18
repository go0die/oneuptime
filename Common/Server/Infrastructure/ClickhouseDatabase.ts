import logger from "../Utils/Logger";
import {
  ClickHouseClientConfigOptions,
  dataSourceOptions,
  testDataSourceOptions,
} from "./ClickhouseConfig";
import { ClickHouseClient, PingResult, createClient } from "@clickhouse/client";
import DatabaseNotConnectedException from "Common/Types/Exception/DatabaseNotConnectedException";
import Sleep from "Common/Types/Sleep";

export type ClickhouseClient = ClickHouseClient;

export default class ClickhouseDatabase {
  private dataSource!: ClickhouseClient | null;

  public getDatasourceOptions(): ClickHouseClientConfigOptions {
    return dataSourceOptions;
  }

  public getTestDatasourceOptions(): ClickHouseClientConfigOptions {
    return testDataSourceOptions;
  }

  public getDataSource(): ClickhouseClient | null {
    return this.dataSource;
  }

  public isConnected(): boolean {
    return Boolean(this.dataSource);
  }

  public async connect(
    dataSourceOptions: ClickHouseClientConfigOptions,
  ): Promise<ClickhouseClient> {
    let retry: number = 0;

    try {
      type ConnectToDatabaseFunction = () => Promise<ClickhouseClient>;
      const connectToDatabase: ConnectToDatabaseFunction =
        async (): Promise<ClickhouseClient> => {
          try {
            const defaultDbClient: ClickhouseClient = createClient({
              ...dataSourceOptions,
              database: "default",
            });
            await defaultDbClient.exec({
              query: `CREATE DATABASE IF NOT EXISTS ${dataSourceOptions.database}`,
            });

            await defaultDbClient.close();

            const clickhouseClient: ClickhouseClient =
              createClient(dataSourceOptions);
            this.dataSource = clickhouseClient;

            const result: PingResult = await clickhouseClient.ping();

            if (result.success === false) {
              throw new DatabaseNotConnectedException(
                "Clickhouse Database is not connected",
              );
            }

            logger.debug(
              `Clickhouse Database Connected: ${dataSourceOptions.host?.toString()}`,
            );

            return clickhouseClient;
          } catch (err) {
            if (retry < 3) {
              logger.debug(
                "Cannot connect to Clickhouse. Retrying again in 5 seconds",
              );
              // sleep for 5 seconds.

              await Sleep.sleep(5000);

              retry++;
              return await connectToDatabase();
            }
            throw err;
          }
        };

      return await connectToDatabase();
    } catch (err) {
      logger.error("Clickhouse Database Connection Failed");
      logger.error(err);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.close();
      this.dataSource = null;
    }
  }

  public async checkConnnectionStatus(): Promise<boolean> {
    // Ping clickhouse to check if the connection is still alive
    try {
      const result: PingResult | undefined = await this.getDataSource()?.ping();

      if (!result) {
        throw new DatabaseNotConnectedException(
          "Clickhouse Database is not connected",
        );
      }

      if (result?.success === false) {
        throw new DatabaseNotConnectedException(
          "Clickhouse Database is not connected",
        );
      }

      return true;
    } catch (err) {
      logger.error("Clickhouse Connection Lost");
      logger.error(err);
      return false;
    }
  }
}

export const ClickhouseAppInstance: ClickhouseDatabase =
  new ClickhouseDatabase();
