module.exports = {
    create: async function(data) {
        try {
            const _this = this;

            // prepare  log model
            let log = new LogModel();
            let content;

            try {
                content = JSON.parse(data.content);
            } catch (error) {
                content = data.content;
            }

            let stringifiedTags = '';
            if (data.tags) {
                typeof data.tags === 'string'
                    ? (stringifiedTags = data.tags)
                    : (stringifiedTags = data.tags.join());
            }

            log.content = content;
            log.stringifiedContent = JSON.stringify(content) + stringifiedTags;
            log.applicationLogId = data.applicationLogId;
            log.type = data.type;
            log.tags = data.tags;
            log.createdById = data.createdById;
            const savedlog = await log.save();
            log = await _this.findOneBy({
                _id: savedlog._id,
            });
            return log;
        } catch (error) {
            ErrorService.log('logService.create', error);
            throw error;
        }
    },
    async findOneBy(query) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted) query.deleted = false;
            const log = await LogModel.findOne(query).populate(
                'applicationLogId',
                'name'
            );
            return log;
        } catch (error) {
            ErrorService.log('logService.findOneBy', error);
            throw error;
        }
    },
    async findBy(query, limit, skip) {
        try {
            if (!skip) skip = 0;

            if (!limit) limit = 0;

            if (typeof skip === 'string') {
                skip = parseInt(skip);
            }

            if (typeof limit === 'string') {
                limit = parseInt(limit);
            }

            if (!query) {
                query = {};
            }

            if (!query.deleted) query.deleted = false;
            const logs = await LogModel.find(query)
                .sort([['createdAt', -1]])
                .limit(limit)
                .skip(skip)
                .populate('applicationLogId', 'name');
            return logs;
        } catch (error) {
            ErrorService.log('logService.findBy', error);
            throw error;
        }
    },
    async getLogsByApplicationLogId(applicationLogId, limit, skip) {
        // try to get the application log by the ID
        const applicationLog = await ApplicationLogService.findOneBy({
            _id: applicationLogId,
        });
        // send an error if the component doesnt exist
        if (!applicationLog) {
            const error = new Error('Application Log does not exist.');
            error.code = 400;
            ErrorService.log('logService.getLogsByApplicationLogId', error);
            throw error;
        }

        try {
            if (typeof limit === 'string') limit = parseInt(limit);
            if (typeof skip === 'string') skip = parseInt(skip);
            const _this = this;

            const logs = await _this.findBy(
                { applicationLogId: applicationLogId },
                limit,
                skip
            );
            return logs;
        } catch (error) {
            ErrorService.log('logService.getLogsByApplicationLogId', error);
            throw error;
        }
    },
    async countBy(query) {
        try {
            if (!query) {
                query = {};
            }

            const count = await LogModel.countDocuments(query);

            return count;
        } catch (error) {
            ErrorService.log('logService.countBy', error);
            throw error;
        }
    },
    search: async function(query, filter, skip, limit) {
        const _this = this;
        query.stringifiedContent = {
            $regex: new RegExp(filter),
            $options: 'i',
        };
        const searchedLogs = await _this.findBy(query, skip, limit);
        const totalSearchCount = await _this.countBy(query);

        return { searchedLogs, totalSearchCount };
    },
    // Introduce this to know the current date range of the query incase it w3asnt given by the user
    async getDateRange(query) {
        try {
            if (!query) {
                query = {};
            }

            if (!query.deleted) query.deleted = false;
            let dateRange = { startDate: '', endDate: '' };
            // if date range is given, it returns it
            if (query.startDate && query.endDate)
                dateRange = {
                    startDate: query.startDate,
                    endDate: query.endDate,
                };
            else {
                // first and last log based on the query is fetched
                const start_date = await LogModel.find(query).limit(1);
                const end_date = await LogModel.find(query)
                    .sort([['createdAt', -1]])
                    .limit(1);
                // if query returns anything, extrate date from both.
                start_date[0] && end_date[0]
                    ? (dateRange = {
                          startDate: start_date[0]['createdAt'],
                          endDate: end_date[0]['createdAt'],
                      })
                    : null;
            }

            return dateRange;
        } catch (error) {
            ErrorService.log('logService.getDateRange', error);
            throw error;
        }
    },
};

const LogModel = require('../models/log');
const ErrorService = require('./errorService');
const ApplicationLogService = require('./applicationLogService');
