Meteor.startup(function () {

  var me;

  // resets
  Meteor.db.gigs.remove({});
  Meteor.db.states.remove({});
  Meteor.db.education.remove({});
  Meteor.db.objective.remove({});
  Meteor.db.session.remove({});
  Meteor.users.remove({
    $not: {
      'username': 'danny'
    }
  });

  try {
    me = Accounts.createUser({
      username: 'danny',
      password: '2Austin123',
      profile: {
        master: true
      }
    });

  } catch (e) {
    me = Meteor.users.findOne({
      username: 'danny'
    });
  }


  // publish records
  Meteor.publish('gigs', function (sessionKey) {
    return Meteor.db.gigs.find({
      session: sessionKey
    });
  });

  Meteor.publish('projects', function () {
    return Meteor.db.projects.find({});
  });

  Meteor.publish('states', function (sessionKey) {
    return Meteor.db.states.find({
      session: sessionKey
    });
  });

  Meteor.publish('education', function () {
    return Meteor.db.education.find({});
  });

  Meteor.publish('objective', function (sessionKey) {
    return Meteor.db.objective.find({
      session: sessionKey
    });
  })

  Meteor.publish('userData', function (config) {
    return Meteor.users.find({});
  });

  Meteor.publish('session', function (key) {
    var isNew = !Meteor.db.session.findOne({
      key: key
    });

    if (isNew) {

      _(gigs)
        .each(function (gig) {

          // create default state record
          var stateId = Meteor.db.states.insert({
            active: 'description',
            session: key
          });

          // create gig record, setting stateId
          Meteor.db.gigs.insert(_(gig)
            .extend({
              stateId: stateId,
              session: key
            }));

        });

      _(education)
        .each(function (edu) {
          Meteor.db.education.insert(_(edu)
            .extend({
              session: key
            }));
        });

      objectiveId = Meteor.db.objective.insert(_(objective)
        .extend({
          session: key
        }));

      // create session
      Meteor.db.session.insert({
        key: key,
        speaker: null,
        masters: [me._id],
        active: {
          collection: 'objective',
          id: objectiveId
        }
      });

    }

    return Meteor.db.session.find({
      key: key
    });
  });

});
