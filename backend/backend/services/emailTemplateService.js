module.exports = {
    create: async function (data) {
        try {
            var emailTemplateModel = new EmailTemplateModel();
            emailTemplateModel.projectId = data.projectId || null;
            emailTemplateModel.subject = data.subject || null;
            emailTemplateModel.body = data.body || null;
            emailTemplateModel.emailType = data.emailType || null;
            emailTemplateModel.allowedVariables = emailTemplateVariables[[data.emailType]];
            var emailTemplate = await emailTemplateModel.save();
            return emailTemplate;
        } catch (error) {
            ErrorService.log('emailTemplateService.create', error);
            throw error;
        }
    },

    update: async function(data){
        try {
            let _this = this;
            if (!data._id) {
                let emailTemplate = await _this.create(data);
                return emailTemplate;
            } else {
                var emailTemplate = await _this.findOneBy({_id: data._id});

                let subject = data.subject || emailTemplate.subject;
                let body = data.body || emailTemplate.body;
                let emailType = data.emailType || emailTemplate.emailType;
                let allowedVariables = emailTemplateVariables[[data.emailType || emailTemplate.emailType || []]];

                var updatedEmailTemplate = await EmailTemplateModel.findByIdAndUpdate(data._id, {
                    $set: {
                        subject: subject,
                        body: body,
                        allowedVariables: allowedVariables,
                        emailType: emailType
                    }
                }, {
                    new: true
                });
                return updatedEmailTemplate;
            }
        } catch (error) {
            ErrorService.log('emailTemplateService.update', error);
            throw error;
        }
    },

    deleteBy: async function(query, userId){
        try {
            var emailTemplate = await EmailTemplateModel.findOneAndUpdate(query, {
                $set:{
                    deleted:true,
                    deletedById:userId,
                    deletedAt:Date.now()
                }
            },{
                new: true
            });
            return emailTemplate;
        } catch (error) {
            ErrorService.log('emailTemplateService.deleteBy', error);
            throw error;
        }
    },

    findBy: async function(query, skip, limit){
        try {
            if(!skip) skip=0;
    
            if(!limit) limit=10;
    
            if(typeof(skip) === 'string'){
                skip = parseInt(skip);
            }
    
            if(typeof(limit) === 'string'){
                limit = parseInt(limit);
            }
    
            if(!query){
                query = {};
            }
    
            query.deleted = false;
            var emailTemplates = await EmailTemplateModel.find(query)
                .sort([['createdAt', -1]])
                .limit(limit)
                .skip(skip)
                .populate('projectId', 'name');
            return emailTemplates;
        } catch (error) {
            ErrorService.log('emailTemplateService.findBy', error);
            throw error;
        }
    },

    findOneBy: async function(query){
        try {
            if(!query){
                query = {};
            }
    
            query.deleted = false;
            var emailTemplate = await EmailTemplateModel.findOne(query)
                .sort([['createdAt', -1]])
                .populate('projectId', 'name');
            return emailTemplate;
        } catch (error) {
            ErrorService.log('emailTemplateService.findOneBy', error);
            throw error;
        }
    },

    countBy: async function (query) {
        try {
            if(!query){
                query = {};
            }
    
            query.deleted = false;
            var count = await EmailTemplateModel.count(query);
            return count;
        } catch (error) {
            ErrorService.log('emailTemplateService.countBy', error);
            throw error;
        }
    },

    getTemplates: async function (projectId){
        let _this = this;
        var templates = await Promise.all(defaultTemplate.map(async (template)=>{
            var emailTemplate = await _this.findOneBy({projectId: projectId, emailType: template.emailType});
            return emailTemplate != null && emailTemplate != undefined ? emailTemplate : template;
        }));
        return templates;
    },

    resetTemplate: async function(projectId, templateId){
        let _this = this;
        var oldTemplate = await _this.findOneBy({_id: templateId});
        var newTemplate = defaultTemplate.filter(template => template.emailType === oldTemplate.emailType)[0];
        var resetTemplate = await _this.update({
            _id: oldTemplate._id, 
            emailType: newTemplate.emailType, 
            subject: newTemplate.subject,
            body: newTemplate.body,
            allowedVariables: newTemplate.allowedVariables
        });
        return resetTemplate;
    },

    hardDeleteBy: async function(query){
        try {
            await EmailTemplateModel.deleteMany(query);
            return 'Email Template(s) removed successfully';
        } catch (error) {
            ErrorService.log('emailTemplateService.hardDeleteBy', error);
            throw error;
        }
    },
};

var EmailTemplateModel = require('../models/emailTemplate');
var ErrorService = require('./errorService');
var emailTemplateVariables = require('../config/emailTemplateVariables');
var defaultTemplate = require('../config/emailTemplate');
