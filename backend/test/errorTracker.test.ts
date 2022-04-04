process.env['PORT'] = 3020;
import { expect } from 'chai';
import userData from './data/user';
import chai from 'chai';
import chaihttp from 'chai-http';
chai.use(chaihttp);
import chaiSubset from 'chai-subset';
chai.use(chaiSubset);
import app from '../server';
import GlobalConfig from './utils/globalConfig';

const request = chai.request.agent(app);

import { createUser } from './utils/userSignUp';
import VerificationTokenModel from '../backend/models/verificationToken';

let token: $TSFixMe,
    userId: string,
    projectId: $TSFixMe,
    componentId: $TSFixMe,
    errorTracker: $TSFixMe,
    errorEvent: $TSFixMe,
    errorEventTwo,
    issueCount = 0,
    errorEventMembers = 0;
const sampleErrorEvent = {};

describe('Error Tracker API', function () {
    this.timeout(80000);

    before(function (done: $TSFixMe) {
        this.timeout(95000);
        GlobalConfig.initTestConfig().then(function () {
            createUser(
                request,
                userData.user,
                function (err: $TSFixMe, res: $TSFixMe) {
                    const project = res.body.project;
                    projectId = project._id;
                    userId = res.body.id;

                    VerificationTokenModel.findOne(
                        { userId },
                        function (err: $TSFixMe, verificationToken: $TSFixMe) {
                            request
                                .get(
                                    `/user/confirmation/${verificationToken.token}`
                                )
                                .redirects(0)
                                .end(function () {
                                    request
                                        .post('/user/login')
                                        .send({
                                            email: userData.user.email,
                                            password: userData.user.password,
                                        })
                                        .end(function (
                                            err: $TSFixMe,
                                            res: $TSFixMe
                                        ) {
                                            token =
                                                res.body.tokens.jwtAccessToken;
                                            const authorization = `Basic ${token}`;
                                            request
                                                .post(`/component/${projectId}`)
                                                .set(
                                                    'Authorization',
                                                    authorization
                                                )
                                                .send({
                                                    name: 'New Component',
                                                })
                                                .end(function (
                                                    err: $TSFixMe,
                                                    res: $TSFixMe
                                                ) {
                                                    componentId = res.body._id;
                                                    expect(res).to.have.status(
                                                        200
                                                    );
                                                    expect(
                                                        res.body.name
                                                    ).to.be.equal(
                                                        'New Component'
                                                    );
                                                    done();
                                                });
                                        });
                                });
                        }
                    );
                }
            );
        });
    });

    it('should reject the request of an unauthenticated user', function (done: $TSFixMe) {
        request
            .post(`/error-tracker/${projectId}/${componentId}/create`)
            .send({
                name: 'New Error Tracker',
            })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(401);
                done();
            });
    });

    it('should reject the request of an empty error tracker name', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(`/error-tracker/${projectId}/${componentId}/create`)
            .set('Authorization', authorization)
            .send({
                name: null,
            })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                done();
            });
    });

    it('should create an error tracker', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(`/error-tracker/${projectId}/${componentId}/create`)
            .set('Authorization', authorization)
            .send({
                name: 'Node Project',
            })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                errorTracker = res.body;
                expect(res).to.have.status(200);
                expect(res.body).to.include({ name: 'Node Project' });
                done();
            });
    });

    it('should return a list of error trackers under component', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .get(`/error-tracker/${projectId}/${componentId}`)
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array');
                done();
            });
    });

    it('should not return a list of error trackers under wrong component', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .get(`/error-tracker/${projectId}/5ee8d7cc8701d678901ab908`) // wrong component ID
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Component does not exist.'
                );
                done();
            });
    });
    // reset api key

    it('should reset error tracker key', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        const currentKey = errorTracker.key;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/reset-key`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body._id).to.be.equal(errorTracker._id); // same error tracker id
                expect(res.body.key).to.not.be.equal(currentKey); // error tracker key has chaged
                errorTracker.key = res.body.key; // update the new key.
                done();
            });
    });
    // edit error tracker details

    it('should update the current error tracker name', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        const appName = 'Python API App';
        request
            .put(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}`
            )
            .set('Authorization', authorization)
            .send({ name: appName })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                const updatedErrorTracker = res.body;
                expect(errorTracker._id).to.be.equal(updatedErrorTracker._id); // same id
                expect(errorTracker.key).to.be.equal(updatedErrorTracker.key); // same key
                expect(updatedErrorTracker.name).to.be.equal(appName); // change of name
                errorTracker = updatedErrorTracker; // update the error track
                done();
            });
    });

    it('should request for eventId for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Event ID is required.');
                done();
            });
    });

    it('should request for fingerprint for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Fingerprint is required.'
                );
                done();
            });
    });

    it('should request for fingerprint as an array for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = 'fingerprint';
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Fingerprint is to be of type Array.'
                );
                done();
            });
    });

    it('should request for error event type for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Error Event Type must be of the allowed types.'
                );
                done();
            });
    });

    it('should request for tags for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];

        sampleErrorEvent.type = 'exception';
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Tags is required.');
                done();
            });
    });

    it('should request for timeline in array format for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];

        sampleErrorEvent.type = 'exception';

        sampleErrorEvent.tags = [];

        sampleErrorEvent.timeline = 'done';
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Timeline is to be of type Array.'
                );
                done();
            });
    });

    it('should request for exception for tracking an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];

        sampleErrorEvent.type = 'exception';

        sampleErrorEvent.timeline = [];
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Exception is required.');
                done();
            });
    });

    it('should declare Error Tracker not existing for an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];

        sampleErrorEvent.type = 'exception';

        sampleErrorEvent.timeline = [];

        sampleErrorEvent.tags = [];

        sampleErrorEvent.exception = {};
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Error Tracker does not exist.'
                );
                done();
            });
    });

    it('should create an error event and set a fingerprint hash and issueId', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];

        sampleErrorEvent.type = 'exception';

        sampleErrorEvent.timeline = [];

        sampleErrorEvent.tags = [];

        sampleErrorEvent.exception = {};

        sampleErrorEvent.errorTrackerKey = errorTracker.key;
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                errorEvent = res.body; // save as an error event

                expect(errorEvent.type).to.be.equal(sampleErrorEvent.type);
                expect(errorEvent).to.have.property('fingerprintHash');
                expect(errorEvent).to.have.property('issueId');
                expect(errorEvent.errorTrackerId).to.be.equal(errorTracker._id);
                issueCount = issueCount + 1; // increment number of new issue created
                done();
            });
    });

    it('should create a new error event with the old fingerprint, create a new one with a different fingerprint and confirm the two have different issueId', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;

        sampleErrorEvent.eventId = 'samplId';

        sampleErrorEvent.fingerprint = ['fingerprint'];

        sampleErrorEvent.type = 'exception';

        sampleErrorEvent.timeline = [];

        sampleErrorEvent.tags = [];

        sampleErrorEvent.exception = {};

        sampleErrorEvent.errorTrackerKey = errorTracker.key;
        request
            .post(`/error-tracker/${errorTracker._id}/track`)
            .set('Authorization', authorization)
            .send(sampleErrorEvent)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200); // weve created an error event with the existing issue fingerprint
                expect(res.body.issueId).to.be.equal(errorEvent.issueId);

                sampleErrorEvent.fingerprint = ['random', 'testing'];
                request
                    .post(`/error-tracker/${errorTracker._id}/track`)
                    .set('Authorization', authorization)
                    .send(sampleErrorEvent)
                    .end(function (err: $TSFixMe, res: $TSFixMe) {
                        expect(res).to.have.status(200);
                        issueCount = issueCount + 1; // weve created a new issue entirely

                        errorEventTwo = res.body;
                        expect(errorEventTwo.type).to.be.equal(errorEvent.type);
                        expect(errorEventTwo.fingerprintHash).to.not.be.equal(
                            errorEvent.fingerprintHash
                        );
                        expect(errorEvent.issueId).to.not.be.equal(
                            errorEventTwo.issueId
                        );
                        done();
                    });
            });
    });

    it('should return a list of issues under an error event', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body.data.errorTrackerIssues).to.be.an('array');
                expect(res.body.data.count).to.be.equal(issueCount); // confirm the issue count is accurate
                done();
            });
    });

    it('should return a list of issues under an error event based on limit', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        const limit = 1;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues`
            )
            .set('Authorization', authorization)
            .send({ limit })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body.data.errorTrackerIssues).to.be.an('array');
                expect(res.body.data.count).to.be.equal(limit); // confirm the issue count is accurate based on the limit
                done();
            });
    });

    it('should return an error event with its next and previous', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/error-events/${errorEvent._id}`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body.errorEvent).to.be.an('object');
                expect(res.body.previous).to.be.equal(null); // since this error event is the first, nothing should come before it
                expect(res.body.next).to.have.property('_id'); // since we createdd another eevent after it, the next should have another event ID
                expect(res.body.totalEvents).to.be.equal(2);
                done();
            });
    });

    it('should return an error when trying to ignore an issue without passing the IssueID', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues/action`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Issue ID is required');
                done();
            });
    });

    it('should return an error when trying to ignore an issue without passing an array of issues', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues/action`
            )
            .set('Authorization', authorization)
            .send({ issueId: errorEvent.issueId })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Issue ID has to be of type array'
                );
                done();
            });
    });

    it('should return an error when trying to ignore an issue without passing a valid action type', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues/action`
            )
            .set('Authorization', authorization)
            .send({ issueId: [errorEvent.issueId], action: 'test' })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal('Action is not allowed');
                done();
            });
    });

    it('should ignore an issue successfully', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues/action`
            )
            .set('Authorization', authorization)
            .send({ issueId: [errorEvent.issueId], action: 'ignore' })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('issues');
                const currentIssue = res.body.issues.filter(
                    (issue: $TSFixMe) => issue._id === errorEvent.issueId
                )[0];
                // expect it to have value of the user that ignored it
                expect(currentIssue.ignoredById).to.have.property('_id');
                expect(currentIssue.ignoredById).to.have.property('name');
                done();
            });
    });

    it('should resolve an issue and change the ignore state successfully', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues/action`
            )
            .set('Authorization', authorization)
            .send({ issueId: [errorEvent.issueId], action: 'resolve' })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('issues');
                const currentIssue = res.body.issues.filter(
                    (issue: $TSFixMe) => issue._id === errorEvent.issueId
                )[0];
                // expect it to have value of the user that resolved it
                expect(currentIssue.resolvedById).to.have.property('_id');
                expect(currentIssue.resolvedById).to.have.property('name');

                // expect it to null the ignored section
                expect(currentIssue.ignoredById).to.be.equal(null);
                done();
            });
    });

    it('should unresolve an issue and change the ignore and resolved state successfully', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/issues/action`
            )
            .set('Authorization', authorization)
            .send({ issueId: [errorEvent.issueId], action: 'unresolve' })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('issues');
                const currentIssue = res.body.issues.filter(
                    (issue: $TSFixMe) => issue._id === errorEvent.issueId
                )[0];
                // expect it to null the resolved section
                expect(currentIssue.resolvedById).to.be.equal(null);

                // expect it to null the ignored section
                expect(currentIssue.ignoredById).to.be.equal(null);
                done();
            });
    });

    it('should not fetch errors attached to a fingerprint if fingerprint is not provided', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/error-events`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Fingerprint Hash is required'
                );
                done();
            });
    });

    it('should fetch errors attached to a fingerprint successfully', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/error-events`
            )
            .set('Authorization', authorization)
            .send({ fingerprintHash: errorEvent.fingerprintHash })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array');
                expect(res.body[res.body.length - 1]._id).to.be.equal(
                    errorEvent._id
                );
                done();
            });
    });

    it('should fetch errors attached to a fingerprint successfully based on limit', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        const limit = 1;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/error-events`
            )
            .set('Authorization', authorization)
            .send({ fingerprintHash: errorEvent.fingerprintHash, limit })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array');
                expect(res.body.length).to.be.equal(limit);
                done();
            });
    });

    it('should fetch members attached to an issue successfully', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/members/${errorEvent.issueId}`
            )
            .set('Authorization', authorization)
            .send({ fingerprintHash: errorEvent.fingerprintHash })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.have.property('issueId');
                expect(res.body).to.be.have.property('issueMembers');
                expect(res.body.issueId).to.be.equal(errorEvent.issueId);
                expect(res.body.issueMembers.length).to.be.equal(
                    errorEventMembers
                );
                done();
            });
    });

    it('should not assign member to issue due to no member ID passed', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/assign/${errorEvent.issueId}`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Team Member ID is required'
                );
                done();
            });
    });

    it('should not assign member to issue if member ID is not of required type', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/assign/${errorEvent.issueId}`
            )
            .set('Authorization', authorization)
            .send({ teamMemberId: userId })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(400);
                expect(res.body.message).to.be.equal(
                    'Team Member ID has to be of type array'
                );
                done();
            });
    });

    it('should assign member to issue if member ID is of required type', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/assign/${errorEvent.issueId}`
            )
            .set('Authorization', authorization)
            .send({ teamMemberId: [userId] })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                errorEventMembers += 1; // increase the member count
                expect(res.body.issueId).to.be.equal(errorEvent.issueId);
                expect(res.body.members.length).to.be.equal(errorEventMembers);
                expect(res.body.members[0].userId._id).to.be.equal(userId); // confirm the user id matches
                expect(res.body.members[0].issueId._id).to.be.equal(
                    errorEvent.issueId
                ); // confirm the issue id matches
                done();
            });
    });

    it('should unassign member to issue if member ID is of required type', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .post(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}/unassign/${errorEvent.issueId}`
            )
            .set('Authorization', authorization)
            .send({ teamMemberId: [userId] })
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                errorEventMembers -= 1;
                expect(res.body.issueId).to.be.equal(errorEvent.issueId);
                expect(res.body.members.length).to.be.equal(errorEventMembers);
                done();
            });
    });
    // delete error tracker

    it('should delete the error tracker', function (done: $TSFixMe) {
        const authorization = `Basic ${token}`;
        request
            .delete(
                `/error-tracker/${projectId}/${componentId}/${errorTracker._id}`
            )
            .set('Authorization', authorization)
            .end(function (err: $TSFixMe, res: $TSFixMe) {
                expect(res).to.have.status(200);
                expect(res.body.deleted).to.be.equal(true);
                done();
            });
    });
});
