// require jquery loaded
$(document).ready(function() {    
  // set default steem node
  steem.api.setOptions({ url: "https://api.steemit.com" });
  
  // set running status = false
  var running = false;

  // update UI progress
  function updateProgress(p) {
      if (p < 0) p = 0;
      if (p > 100) p = 100;
      var dom = $('#bar');
      dom.css('width', p + '%'); 
      dom.html(p + '%');
  }
  
  // print message to console div
  function log(msg) {
    var t = $('#console').val();
    var ccc = $('#console');  
    ccc.val(t + "\n" + msg);
    ccc.scrollTop(ccc[0].scrollHeight);     
  }  
  
  // return a URL for given Steem ID
  function steem_url(id) {
    return "<a target=_blank rel=nofollow href='https://steemit.com/@" + id + "'>@" + id + "</a>";
  }
  
  // scan account history for transfer records
  function getHistory(account, total, from, limit, unit, type, dir) {
    if (from < limit) {
      limit = from;
    }
    steem.api.getAccountHistory(account, from, limit, function (err, result) {
      if (err) {
        log(err);
        return;
      }
      if (running == false) return;
      var cont = from > 0;
      result.forEach(function (tx) {
        var op = tx[1].op;
        var op_type = op[0];
        var op_value = op[1];
  
        if (running == false) return;
        var timestamp = tx[1].timestamp;
                          
        if ((op_type == "transfer") && (op_value.to == account || op_value.from == account)) {              
  
            // filtering
            var thememo = op[1].memo;
            if (type == 1) {
                if (thememo.startsWith('#')) {
                    return;
                }    
            }
            if (type == 2) {
                if (!thememo.startsWith('#')) {
                    return;
                }                
            }
            if (dir == 1) {
                if (op_value.to == account) {
                    return;
                }
            }
            if (dir == 2) {
                if (op_value.from == account) {
                    return;
                }            
            }
            
            var memotype = $('#memotype').val();
            if (memotype == 1) {
                if (thememo == '') {
                    return;
                }
            }
            if (memotype == 2) {
                if (thememo != '') {
                    return;
                }
            }
            
            var amount_min = $('#amount_min').val();
            var amount_max = $('#amount_max').val();

            var amount1 = parseFloat(op[1].amount.split(' ')[0]);
            if ((amount1 < amount_min) || (amount1 > amount_max)) {
                return;
            }
            
            var senderc = $('#senderc').val().trim().toLowerCase();
            if (senderc != '') {
                if (!op_value.from.includes(senderc)) {
                    return;
                }
            }
            
            var rxc = $('#rxc').val().trim().toLowerCase();
            if (rxc != '') {
                if (!op_value.to.includes(rxc)) {
                    return;
                }
            }

            var memoc = $('#memoc').val().trim().toLowerCase();
            if (memoc != '') {
                if (!thememo.toLowerCase().includes(memoc)) {
                    return;
                }
            }
            
            var theunit = op[1].amount.split(' ')[1];
             
            // check if unit matches
            if ((theunit == unit) || (unit == '')) {
              log(tx[1].timestamp + ": @" + op[1].from + " sends " + op[1].amount + " to @" + op_value.to);// + " memo = " + op[1].memo);
              
              var sorttype = $('#sorttype').val();
              var row = '<tr><td>' + steem_url(op[1].from) + '</td><td>' + steem_url(op[1].to) + "</td><td>" + amount1.toFixed(3) + '</td><td>' + theunit + '</td><td class=overflow-wrap-hack>' +  '<div class=content>' + thememo + '</div></td><td>' + timestamp + '<BR/><a target=_blank rel=nofollow href="https://steemd.com/tx/' + tx[1].trx_id + '">' +  '(Block 🔗)</a></td></tr>';
              
              if (sorttype == '1') {
                $('#dvlist').first().prepend(row);
              } else {
                $('#dvlist').last().append(row);              
              }
            }
          }        
      });
      if (cont) {      
        if (running == false) return;
        var fromOp = from - limit;
        if (fromOp < limit) {
          limit = fromOp;
        }      
        var per = (100 - 100* (from - limit) / total).toFixed(2);
        updateProgress(per);
        log(per + "% Getting ops starting from " + (from - limit));
        getHistory(account, total, fromOp, limit, unit, type, dir);
      } else {
        updateProgress(100);
        log('Done!');
      }
    });
  }
  
  function getTransfer(account, unit, type, dir) {
    if (running) {
        alert('Please Stop Ongoing Search First.');
        return;   
    }
    running = true;
    steem.api.getAccountHistory(account, -1, 0, function (err, result) {
        var opCount = result[0][0];
        log("Total transaction to process: " + opCount);
        if (running == false) return;
        getHistory(account, opCount, opCount, 1000, unit, type, dir);
    });
  }  
  
  // when run button is clicked
  $('input#run').click(function() {
    steem.api.setOptions({ url: $('select#nodes').val() });
    var acc = $('#steemid').val().trim().toLowerCase();
    var unit = $('#unit').val().trim();
    var type = $('#type').val();
    var dir =  $('#dir').val(); 
    if (steem.utils.validateAccountName(acc) == null) {
        getTransfer(acc, unit, type, dir);        
    } else {
        alert('Invalid Steem ID given.');
    }    
  });
  
  $('#clearlog').click(function() {
    $('#console').val('');
    $('#dvlist tbody').html("");
  });  
  
  $('#stop').click(function() {
    running = false;
    updateProgress(0);
    log('Stopped.');
  });   
});
