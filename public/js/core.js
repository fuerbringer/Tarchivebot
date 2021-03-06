var tarchive = angular.module('tarchive', ['APIService', 'ngTable', 'ngSanitize'])

tarchive.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|data):/)
}
])

tarchive.controller('CoreController', ['$scope', '$filter', 'API', 'NgTableParams', function ($scope, $filter, API, NgTableParams) {
  $scope.key = localStorage.getItem('tarchiveKey')
  $scope.messageAmount = 1000 // TODO make this variable by dropdown
  $scope.tableData = []
  $scope.content = 'table'
  $scope.tableSearch = {}

  $scope.messageTable = new NgTableParams({
    page: 1,            // show first page
    count: 10           // count per page
  }, {
    total: $scope.tableData.length, // length of data
    getData: function (params) {
      // use built-in angular filter
      var orderedData = params.filter() ? $filter('filter')($scope.tableData, params.filter()) : $scope.tableData
      params.total(orderedData.length)

      var sorted = $filter('orderBy')(orderedData, params.orderBy())

      var paged = sorted.slice((params.page() - 1) * params.count(), params.page() * params.count())

      return paged
    }
  })

  $scope.getRecentMessages = function () {
    API.recent($scope.key, $scope.messageAmount, function (data) {
      $scope.tableData = data
      $scope.messageTable.reload()
      $scope.setMessageCount()
      $scope.setJsonExportData()
    })
  }

  $scope.getMessagesByString = function () {
    var str = $scope.tableSearch.message
    if (str) {
      API.search($scope.key, $scope.messageAmount, str, function (data) {
        $scope.tableData = data
        $scope.messageTable.reload()
        $scope.setMessageCount()
        $scope.setJsonExportData()
      })
    }
  }

  $scope.resetMessages = function () {
    $scope.tableSearch.message = null
    $scope.getRecentMessages()
  }

  $scope.askForKey = function () {
    swal({
      html: true,
      title: 'Welcome to Tarchivepanel!',
      text: 'What is Tarchivebot? <br><br> A Telegram bot that archives your chat and provides you with a web interface to look up messages and statistics. <br><br> Add the bot using this link: ' +
            '<a href="https://t.me/Tarchivebot" target="_blank">Tarchivebot</a><br>' +
            'The bot requires read access to messages! <br><br>' +
            'To retrieve your key simply type /apikey into chat<br><br>' +
            'Enter the key provided by the bot in Telegram below:',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: false,
      animation: true,
      inputPlaceholder: 'Key'
    },
    function (inputValue) {
      if (inputValue === false) return false

      if (inputValue === '') {
        swal.showInputError('You need to write something!')
        return false
      }

      API.validateKey(inputValue, function (data) {
        if (data.status === true) {
          localStorage.setItem('tarchiveKey', inputValue)
          $scope.key = inputValue

          $scope.getRecentMessages()

          swal({
            title: 'Nice!',
            text: "This is the key you entered:<br><code style='word-wrap:break-word;'>" + inputValue + '</code>',
            type: 'success',
            html: true
          })
        } else {
          swal.showInputError("Oops! That doesn't appear to be a valid key.")
          return false
        }
      })
    })
  }

  $scope.setMessageCount = function () {
    if ($scope.tableData && $scope.tableData.length) {
      $scope.messageCount = $scope.tableData.length
    } else {
      $scope.messageCount = 0
    }
  }

  $scope.setJsonExportData = function () {
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify($scope.tableData))
    $scope.jsonData = dataStr
    $scope.jsonDataFile = Date.now() + '_tarchive_table.json'

    if ($scope.tableData && $scope.tableData.length) {
      $scope.exportButtonClass = 'btn-export'
    } else {
      $scope.exportButtonClass = 'invisible'
    }
  }

  if ($scope.key === null) {
    $scope.askForKey()
    $scope.exportButtonClass = 'invisible'
  } else {
    $scope.getRecentMessages()
  }
}])
