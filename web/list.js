'use strict';
require(['expert_util', 'nav', 'roles'], function(expert_util, nav, roles) {

Parse.initialize("NuW6H8xbLQNdqSq0NdCWm2Zj7PoC0Dnnwh0wPL27", "ig9ZGZ268OqMor3c50w2vuvzd3EDVkQmNpSNDbwW");

var currentCompany = Parse.User.current();
var userQuery = new Parse.Query(Parse.User);
userQuery.include('expertise');
userQuery.equalTo('role', roles.EXPERT);
userQuery.exists('price');
userQuery.descending('rank');  // puts unranked last

var Expertise = Parse.Object.extend('Expertise');
var expertiseQuery = new Parse.Query(Expertise);
var InterviewRequest = Parse.Object.extend('InterviewRequest');

var userToBox = {};  // user id to box in list
var expertiseToUser = {};  // expertise id to user id
var expertiseMap = {};  // expertise id to name

var appliedFilters = [];

$(function() {
  if (!checkCompanyLogin()) {
    alert('This page is just for companies!');
    nav.goHome();
    return;
  }

  expertiseQuery.find({
    success: function(results) {
      for (var i in results) {
        var expertise = results[i];
        expertiseMap[expertise.id] = expertise.get("name");
      }
      setUpFilters(results);
    }
  });

  userQuery.find({
    success: function(users) {
      for (var i in users) {
        setUpUser(users[i]);
      }
    }
  });

  var currentExpertId = -1;
  setTimeout(function() {
    // I hate myself
    $('.request-modal-button').on('click', function() {
      currentExpertId = $(this).data('expert-id');
      return true; // bubble
    });
  }, 800);
  $('.form-createRequest').on('submit', function(e) {
    var name = $('#candidateName').val();
    var email = $('#candidateEmail').val();
    var phone = $('#candidatePhone').val();
    var focus = $('#candidateFocus option:selected').val();
    var otherInfo = $('#inputDesc').val();

    userQuery.get(currentExpertId, {
      success: function(expert) {
        var ir = new InterviewRequest();
        //ir.set('candidateName', name);
        ir.set('candidateEmail', email);
        //ir.set('candidatePhone', phone);
        ir.set('candidateFocus', focus);
        ir.set('otherInfo', otherInfo);
        ir.set('company', currentCompany);
        ir.set('expert', expert);
        ir.set('state', 'REQUESTED');
        ir.save({
          success: function(saved) {
            // Send to email endpoint
            $.get('/send?email=' + expert.get('username') + '&company=' + currentCompany.get('companyName')
                 + '&requestId=' + saved.id + '&price=' + expert.get('price'));
          }
        });

        $('#requestModal').modal('hide');
      }
    });

    return false;
  });

  var t = null;
  $('#search').on('keydown', function() {
    if (t) clearTimeout(t);
    t = setTimeout(function() {
      var val = $('#search').val();
      if (val.length > 2) {
        $('#searchterm-container').show();
        filter(val);
      } else {
        $('#searchterm-container').hide();
      }
    }, 250);
  });

  $('#filter_container').on('click', '.expertise', toggleFilter);
});

function toggleFilter(e) {
  $(this).toggleClass('selected');
  var id = $(this).data('id');
  var filterIndex = $.inArray(id, appliedFilters);
  if (filterIndex === -1) {
    appliedFilters.push(id);
  } else {
    appliedFilters.splice(filterIndex, 1);
  }
  applyFilters();
}

function applyFilters() {
  var filteredUsers = Object.keys(userToBox);  // all users.
  for (var i in appliedFilters) {
    var expertiseId = appliedFilters[i];
    var expertUsers = expertiseToUser[expertiseId];
    if (expertUsers) {
      filteredUsers = $(filteredUsers).filter(expertUsers);
    } else {
      filteredUsers = [];
      break;  // no users match.
    }
  }
  updateVisibleBoxs(filteredUsers);
}

function updateVisibleBoxs(usersToShow) {
  if (!usersToShow.length) {
    $('#zerohero').show();
  } else {
    $('#zerohero').hide();
  }

  for (var i in userToBox) {
    if ($.inArray(i, usersToShow) !== -1) {
      userToBox[i].show();
    } else {
      userToBox[i].hide();
    }
  }
}

function setUpUser(user) {
  var box = addBox(user);
  userToBox[user.id] = box;
  var userExpertise = user.get("expertise");
  for (var i in userExpertise) {
    if (expertiseToUser[userExpertise[i].id]) {
      expertiseToUser[userExpertise[i].id].push(user.id);
    } else {
      expertiseToUser[userExpertise[i].id] = [user.id];
    }
  }
};

function checkCompanyLogin() {
  var user = Parse.User.current();
  return user.get("role").toUpperCase() === roles.COMPANY;
}

function setUpFilters(expertises) {
  var expertiseHtml = getExpertisesPills(expertises);
  $('#filter_container').html(expertiseHtml);
}

var getExpertisesPills = function(expertises) {
  var pills_html = [];
  for (var i in expertises) {
    pills_html.push(tmpl('expertise_pill', {
      expertise: {
        id: expertises[i].id,
        name: expertises[i].get('name')
      }
    }));
  }
  return pills_html.join('');
};

function addBox(opts) {
  var expertise = opts.get('expertise');
  var skills = '';
  for (var i in expertise) {
    if (i > 0) skills += '</span>';
    skills += '<span class="button pill" style="font-size: 12px; margin-right: 5px; background-color:#fff; border: 1px solid #ccc; color: #646464;height: 2.2em; line-height: 2.2em;">' + expertise[i].get('name');
  }
  var templateParams = {
    firstName: opts.get('givenName') || '',
    lastName: opts.get('familyName') || '',
    name: opts.getUsername(),
    desc: opts.get('details'),
    hourly: opts.get('price'),
    interviewCount: opts.get('interviewCount'),
    recRate: opts.get('recRate'),
    organization: opts.get('organization') || '',
    social: opts.get('social') || [],
    image: expert_util.getImgUrl(opts),
    skills: skills,
    expert_id: opts.id,
    ui: 'list'
  };
  var $box = $(tmpl(document.getElementById('box-template').innerHTML, templateParams));
  $('#boxes').append($box);
  var score = opts.get('score');
  if (score) {
    $('#expert' + opts.id).find('.stars').raty({
      score: opts.get('score'),
      readOnly: true,
      path: 'lib/raty/images'
    });
  }
  return $box;
}

});
