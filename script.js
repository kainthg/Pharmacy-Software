// Custom Toast Function
    function showToast(message, type = 'error') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      let icon = 'ℹ️';
      if(type === 'error') icon = '❌';
      if(type === 'success') icon = '✅';
      
      toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => toast.classList.add('show'), 10);

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    let medicines = JSON.parse(localStorage.getItem('aliMedicines')) || [];
    let customers = JSON.parse(localStorage.getItem('aliCustomers')) || [];
    let companies = JSON.parse(localStorage.getItem('aliCompanies')) || [];
    let distributors = JSON.parse(localStorage.getItem('aliDistributors')) || [];
    let salesRecords = JSON.parse(localStorage.getItem('aliSalesRecords')) || [];
    
    let billItems = [];
    let currentUserRole = "";
    let selectedMedIdForBill = null;
    let activeCustomer = null;
    let invoiceCounter = parseInt(localStorage.getItem('aliInvoiceCounter')) || 1001;

    // ==================== LOGIN / LOGOUT ====================
    function login() {
      const userInput = document.getElementById('loginUser');
      const passInput = document.getElementById('loginPass');
      const errorText = document.getElementById('loginError');
      const user = userInput.value.toLowerCase().trim();
      const pass = passInput.value;

      errorText.style.display = 'none';

      if(pass !== "123") {
        errorText.innerText = "❌ Username or Password is incorrect!";
        errorText.style.display = 'block';
        passInput.value = '';
        passInput.focus();
        return;
      }

      if(user === "admin") {
        currentUserRole = "Admin";
        document.getElementById('user-display').innerText = "👤 Admin";
        document.getElementById('user-display-inv').innerText = "👤 Admin";
        document.getElementById('user-display-rep').innerText = "👤 Admin";
        document.getElementById('menu-inventory').style.display = "block";
        document.getElementById('menu-reports').style.display = "block";
      } else if(user === "cashier") {
        currentUserRole = "Cashier";
        document.getElementById('user-display').innerText = "👤 Cashier";
        document.getElementById('user-display-inv').innerText = "👤 Cashier";
        document.getElementById('user-display-rep').innerText = "👤 Cashier";
        document.getElementById('menu-inventory').style.display = "none";
        document.getElementById('menu-reports').style.display = "none";
      } else {
        errorText.innerText = "❌ Username or Password is incorrect!";
        errorText.style.display = 'block';
        userInput.value = '';
        userInput.focus();
        return;
      }

      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app-screen').classList.remove('hidden');
      passInput.value = '';
      errorText.style.display = 'none';
      showPage('dashboard');
    }

    function logout() {
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('app-screen').classList.add('hidden');
      document.getElementById('loginUser').value = '';
      document.getElementById('loginPass').value = '';
      document.getElementById('loginError').style.display = 'none';
      currentUserRole = "";
    }

    function showPage(pageName) {
      if(currentUserRole === "Cashier" && (pageName === 'inventory' || pageName === 'config' || pageName === 'reports')) {
        showToast("Access Denied! Only Admin can access this page.", "error"); return;
      }

      document.querySelectorAll('.main-content > div').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.sidebar .menu-item').forEach(el => el.classList.remove('active'));

      document.getElementById('page-' + pageName).classList.remove('hidden');
      document.getElementById('menu-' + pageName).classList.add('active');

      if(pageName === 'billing') { resetBillingForm(); }
      else if(pageName === 'dashboard') { updateDashboard(); }
      else if(pageName === 'inventory') { 
        renderMedicinesTable(); renderCompanies(); renderDistributors(); renderCustomersTable();
        openTab('inventory', 'tab-items', document.querySelector('#page-inventory .tab-btn')); 
      }
      else if(pageName === 'reports') { 
        calculateAnalytics(); renderAlerts();
        openTab('reports', 'tab-profit', document.querySelector('#page-reports .tab-btn')); 
      }
    }

    function openTab(pageId, tabId, btnElement) {
      const page = document.getElementById('page-' + pageId);
      page.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      page.querySelectorAll('.sub-section').forEach(sec => sec.classList.remove('active'));
      if(btnElement) btnElement.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    function updateDashboard() {
      document.getElementById('dash-total-meds').innerText = medicines.length;
      let lowStockCount = 0;
      medicines.forEach(med => { if(med.stock <= 10) lowStockCount++; });
      document.getElementById('dash-low-stock').innerText = lowStockCount;
      let totalProfit = 0;
      salesRecords.forEach(record => { totalProfit += record.profit; });
      document.getElementById('dash-profit').innerText = "Rs. " + totalProfit.toFixed(2);
    }

    // ==================== COMPANIES ====================
    function addCompany() {
      const name = document.getElementById('compName').value.trim();
      if(!name) { showToast("Enter company name!", "error"); return; }
      if(!companies.includes(name)) companies.push(name);
      localStorage.setItem('aliCompanies', JSON.stringify(companies));
      document.getElementById('compName').value = '';
      renderCompanies();
      loadDistributorDropdowns();
      showToast("Company added successfully!", "success");
    }

    function renderCompanies() {
      const tbody = document.getElementById('companiesTableBody');
      if(tbody) tbody.innerHTML = companies.length === 0
        ? '<tr><td colspan="2" style="text-align:center;">No companies added yet.</td></tr>'
        : companies.map(c => `<tr><td>${c}</td><td><button onclick="deleteCompany('${c}')" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">❌</button></td></tr>`).join('');

      const distCompSelect = document.getElementById('distCompanies');
      if(distCompSelect) distCompSelect.innerHTML = companies.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function deleteCompany(c) {
      if(confirm("Delete company?")) {
        companies = companies.filter(x => x !== c);
        localStorage.setItem('aliCompanies', JSON.stringify(companies));
        renderCompanies();
        loadDistributorDropdowns();
        showToast("Company deleted.", "success");
      }
    }

    // ==================== DISTRIBUTORS ====================
    function addDistributor() {
      const name = document.getElementById('distName').value.trim();
      const selected = Array.from(document.getElementById('distCompanies').selectedOptions).map(opt => opt.value);
      if(!name || selected.length === 0) { showToast("Enter name and select at least one company!", "error"); return; }

      distributors.push({ name: name, companies: selected });
      localStorage.setItem('aliDistributors', JSON.stringify(distributors));
      document.getElementById('distName').value = '';
      document.getElementById('distCompanies').selectedIndex = -1;
      renderDistributors();
      loadDistributorDropdowns();
      showToast("Distributor added successfully!", "success");
    }

    function renderDistributors() {
      const tbody = document.getElementById('distributorsTableBody');
      if(!tbody) return;
      tbody.innerHTML = distributors.length === 0
        ? '<tr><td colspan="3" style="text-align:center;">No distributors added yet.</td></tr>'
        : distributors.map(d => `<tr><td><b>${d.name}</b></td><td>${d.companies.join(', ')}</td><td><button onclick="deleteDistributor('${d.name}')" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">❌</button></td></tr>`).join('');
    }

    function deleteDistributor(name) {
      if(confirm("Delete distributor?")) {
        distributors = distributors.filter(x => x.name !== name);
        localStorage.setItem('aliDistributors', JSON.stringify(distributors));
        renderDistributors();
        loadDistributorDropdowns();
        showToast("Distributor deleted.", "success");
      }
    }

    function loadDistributorDropdowns() {
      const select = document.getElementById('medDistributor');
      if(!select) return;
      select.innerHTML = '<option value="">-- Select Distributor --</option>' + distributors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }

    function updateCompanyDropdown() {
      const distName = document.getElementById('medDistributor').value;
      const compSelect = document.getElementById('medCompany');
      compSelect.innerHTML = '<option value="">-- Select Company --</option>';
      if(!distName) return;
      const dist = distributors.find(d => d.name === distName);
      if(dist) compSelect.innerHTML += dist.companies.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // ==================== MEDICINES ====================
    function addMedicine() {
      const name = document.getElementById('medName').value.trim();
      const mfg = document.getElementById('medCompany').value;
      const dist = document.getElementById('medDistributor').value;
      const purPriceBox = parseFloat(document.getElementById('medPurPrice').value);
      const salePriceBox = parseFloat(document.getElementById('medSalePrice').value);
      const unitsPerBox = parseInt(document.getElementById('medUnitsPerBox').value);
      const stockBoxes = parseInt(document.getElementById('medStock').value);
      
      const mfgDate = document.getElementById('medMfgDate').value;
      const expiryDate = document.getElementById('medExpiryDate').value;

      if(!name || !mfg || !dist || !purPriceBox || !salePriceBox || !unitsPerBox || !stockBoxes || !mfgDate || !expiryDate) {
        showToast("Please fill all fields (including Mfg and Expiry dates)!", "error"); return;
      }

      const purPricePerUnit = purPriceBox / unitsPerBox; 
      const salePricePerUnit = salePriceBox / unitsPerBox;
      const totalUnits = unitsPerBox * stockBoxes;

      medicines.push({ 
        id: Date.now(), 
        name: name, 
        mfg: mfg, 
        dist: dist,
        purPrice: purPricePerUnit, 
        salePrice: salePricePerUnit, 
        purPriceBox: purPriceBox, 
        salePriceBox: salePriceBox,
        unitsPerBox: unitsPerBox, 
        stock: totalUnits,
        mfgDate: mfgDate,
        expiryDate: expiryDate
      });
      saveData();

      document.getElementById('medName').value = '';
      document.getElementById('medDistributor').value = '';
      document.getElementById('medCompany').value = '';
      document.getElementById('medPurPrice').value = '';
      document.getElementById('medSalePrice').value = '';
      document.getElementById('medUnitsPerBox').value = '';
      document.getElementById('medStock').value = '';
      document.getElementById('medMfgDate').value = '';
      document.getElementById('medExpiryDate').value = '';

      renderMedicinesTable();
      showToast("Item added to Inventory!", "success");
    }

    function renderMedicinesTable() {
      const tbody = document.getElementById('medicinesTableBody');
      tbody.innerHTML = '';
      if(medicines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No items added yet.</td></tr>';
        return;
      }
      const today = new Date();
      
      medicines.forEach((med) => {
        const boxesLeft = (med.stock / med.unitsPerBox).toFixed(1);
        let stockDisplay = med.stock <= 10
          ? `<span class="danger-text">${med.stock} Units (Low)</span>`
          : `<b>${med.stock} Units</b><br><small style="color:#718096">(${boxesLeft} Box left)</small>`;
        
        let expiryStatus = "";
        if(med.expiryDate) {
          const expDate = new Date(med.expiryDate);
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          
          if(diffDays < 0) {
            expiryStatus = `<span class="danger-text">EXPIRED!</span><br><small style="color:#e53e3e">${med.expiryDate}</small>`;
          } else if(diffDays <= 30) {
            expiryStatus = `<span class="warning-text">Expiring Soon (${diffDays} days)</span><br><small style="color:#718096">${med.expiryDate}</small>`;
          } else {
            expiryStatus = `<span style="color:#38a169;">${med.expiryDate}</span>`;
          }
        }

        const purUnit = med.purPrice.toFixed(2);
        const saleUnit = med.salePrice.toFixed(2);

        tbody.innerHTML += `<tr>
          <td><b>${med.name}</b></td>
          <td>${med.mfg}</td>
          <td><b>Box:</b> Rs. ${med.purPriceBox}<br><small style="color:#718096">1 Unit: Rs. ${purUnit}</small></td>
          <td><b>Box:</b> Rs. ${med.salePriceBox}<br><small style="color:#718096">1 Unit: Rs. ${saleUnit}</small></td>
          <td>${stockDisplay}</td>
          <td>${expiryStatus}</td>
          <td><button onclick="deleteMedicine(${med.id})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">❌</button></td>
        </tr>`;
      });
    }

    function deleteMedicine(id) {
      if(confirm("Are you sure?")) {
        medicines = medicines.filter(med => med.id !== id);
        saveData();
        renderMedicinesTable();
        showToast("Item deleted.", "success");
      }
    }

    // ==================== CUSTOMERS ====================
    function addCustomer() {
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const discount = document.getElementById('custDiscount').value;
      if(!name || !phone) { showToast("Please enter customer name and phone!", "error"); return; }

      customers.push({
        id: Date.now(), name: name, phone: phone,
        discount: parseInt(discount) || 0, totalPurchases: 0, history: []
      });
      saveCustomerData();

      document.getElementById('custName').value = '';
      document.getElementById('custPhone').value = '';
      document.getElementById('custDiscount').value = '';
      renderCustomersTable();
      showToast("Customer added successfully!", "success");
    }

    function renderCustomersTable() {
      const tbody = document.getElementById('customersTableBody');
      tbody.innerHTML = '';
      if(customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No customers added yet.</td></tr>';
        return;
      }
      customers.forEach((cust) => {
        tbody.innerHTML += `<tr>
          <td><b>${cust.name}</b></td>
          <td>${cust.phone}</td>
          <td>${cust.discount}%</td>
          <td>Rs. ${cust.totalPurchases || 0}</td>
          <td><button onclick="deleteCustomer(${cust.id})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">❌</button></td>
        </tr>`;
      });
    }

    function deleteCustomer(id) {
      if(confirm("Delete this customer?")) {
        customers = customers.filter(c => c.id !== id);
        saveCustomerData();
        renderCustomersTable();
        showToast("Customer deleted.", "success");
      }
    }

    function saveCustomerData() { localStorage.setItem('aliCustomers', JSON.stringify(customers)); }

    // ==================== BILLING ====================
    function resetBillingForm() {
      document.getElementById('billingCustSearch').value = '';
      document.getElementById('custSearchResults').style.display = 'none';
      document.getElementById('custInfoBox').style.display = 'none';
      document.getElementById('billingSearchInput').value = '';
      document.getElementById('searchResults').style.display = 'none';
      activeCustomer = null;
      selectedMedIdForBill = null;
      document.getElementById('discountInput').value = 0;
      billItems = [];
      updateBillTable();
    }

    function searchCustomer() {
      const input = document.getElementById('billingCustSearch').value.toLowerCase();
      const resultsBox = document.getElementById('custSearchResults');

      if(input.length === 0) {
        resultsBox.style.display = 'none';
        document.getElementById('custInfoBox').style.display = 'none';
        activeCustomer = null;
        return;
      }

      const filteredCusts = customers.filter(c => c.phone.includes(input) || c.name.toLowerCase().includes(input));

      if(filteredCusts.length === 0) {
        resultsBox.innerHTML = '<div class="search-item" style="color:red;">No customer found!</div>';
      } else {
        resultsBox.innerHTML = filteredCusts.map(cust =>
          `<div class="search-item" onclick="selectCustomerForBill(${cust.id})"><b>${cust.name}</b> <span class="stock">(${cust.phone})</span></div>`
        ).join('');
      }
      resultsBox.style.display = 'block';
    }

    function selectCustomerForBill(id) {
      activeCustomer = customers.find(c => c.id === id);
      document.getElementById('billingCustSearch').value = activeCustomer.name + " (" + activeCustomer.phone + ")";
      document.getElementById('custSearchResults').style.display = 'none';
      document.getElementById('custInfoBox').style.display = 'block';
      document.getElementById('infoCustName').innerText = activeCustomer.name;
      document.getElementById('infoCustPhone').innerText = activeCustomer.phone;
      document.getElementById('infoCustDiscount').innerText = activeCustomer.discount;
    }

    function loadLastBill() {
      if(!activeCustomer) return;
      if(!activeCustomer.history || activeCustomer.history.length === 0) {
        showToast("This customer has no purchase history yet!", "error"); return;
      }

      const lastBill = activeCustomer.history[activeCustomer.history.length - 1].items;
      billItems = [];

      lastBill.forEach(item => {
        const med = medicines.find(m => m.id === item.medId);
        if(med) {
          billItems.push({ name: med.name, price: med.salePrice, qty: item.qty, total: med.salePrice * item.qty, medId: med.id });
        }
      });

      updateBillTable();
      showToast("Last purchased medicines loaded!", "success");
    }

    function searchMedicine() {
      const input = document.getElementById('billingSearchInput').value.toLowerCase();
      const resultsBox = document.getElementById('searchResults');

      if(input.length === 0) { resultsBox.style.display = 'none'; return; }

      const filteredMeds = medicines.filter(med => med.name.toLowerCase().includes(input) && med.stock > 0);

      if(filteredMeds.length === 0) {
        resultsBox.innerHTML = '<div class="search-item" style="color:red;">No item found in stock!</div>';
      } else {
        resultsBox.innerHTML = filteredMeds.map(med =>
          `<div class="search-item" onclick="selectMedicineForBill(${med.id}, '${med.name.replace(/'/g, "\\'")}', ${med.salePrice}, ${med.stock})">${med.name} <span class="stock">(Stock: ${med.stock})</span><span class="price">Rs. ${med.salePrice.toFixed(2)}</span></div>`
        ).join('');
      }
      resultsBox.style.display = 'block';
    }

    function selectMedicineForBill(id, name, price, stock) {
      selectedMedIdForBill = { id: id, name: name, price: price, stock: stock };
      document.getElementById('billingSearchInput').value = name;
      document.getElementById('searchResults').style.display = 'none';
      document.getElementById('billingQty').focus();
    }

    document.addEventListener('click', function(event) {
      const searchBox = document.getElementById('billingSearchInput');
      const resultsBox = document.getElementById('searchResults');
      if (searchBox && resultsBox && event.target !== searchBox && !resultsBox.contains(event.target)) {
        resultsBox.style.display = 'none';
      }
      const custSearchBox = document.getElementById('billingCustSearch');
      const custResultsBox = document.getElementById('custSearchResults');
      if (custSearchBox && custResultsBox && event.target !== custSearchBox && !custResultsBox.contains(event.target)) {
        custResultsBox.style.display = 'none';
      }
    });

    function addToBill() {
      const qtyInput = document.getElementById('billingQty');
      const qty = parseInt(qtyInput.value);

      if(!selectedMedIdForBill) { showToast("Please search and select a medicine first!", "error"); return; }
      if(qty < 1) { showToast("Quantity must be at least 1!", "error"); return; }
      if(qty > selectedMedIdForBill.stock) { showToast(`Only ${selectedMedIdForBill.stock} items available in stock!`, "error"); return; }

      billItems.push({
        name: selectedMedIdForBill.name, price: selectedMedIdForBill.price,
        qty: qty, total: selectedMedIdForBill.price * qty, medId: selectedMedIdForBill.id
      });

      qtyInput.value = 1;
      document.getElementById('billingSearchInput').value = '';
      selectedMedIdForBill = null;
      updateBillTable();
      showToast("Item added to bill.", "success");
    }

    function changeQty(index, newQty) {
      let qty = parseInt(newQty);
      if(isNaN(qty) || qty < 1) qty = 1;
      const med = medicines.find(m => m.id === billItems[index].medId);
      if(qty > med.stock) { showToast(`Only ${med.stock} items available in stock!`, "error"); qty = med.stock; }

      billItems[index].qty = qty;
      billItems[index].total = billItems[index].price * qty;
      updateBillTable();
    }

    function updateBillTable() {
      const tbody = document.getElementById('billTableBody');
      tbody.innerHTML = '';
      let subTotal = 0;

      billItems.forEach((item, index) => {
        subTotal += item.total;
        tbody.innerHTML += `<tr>
          <td>${item.name}</td>
          <td>Rs. ${item.price.toFixed(2)}</td>
          <td><input type="number" class="qty-input" value="${item.qty}" min="1" onchange="changeQty(${index}, this.value)"></td>
          <td>Rs. ${item.total.toFixed(2)}</td>
          <td><button onclick="removeBillItem(${index})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">❌</button></td>
        </tr>`;
      });

      const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
      const discountAmount = (subTotal * discountPercent) / 100;
      let finalTotal = subTotal - discountAmount;
      if(finalTotal < 0) finalTotal = 0;

      document.getElementById('subTotal').innerText = subTotal.toFixed(2);
      document.getElementById('grandTotal').innerText = finalTotal.toFixed(2);
    }

    function removeBillItem(index) { billItems.splice(index, 1); updateBillTable(); }

    function printBill() {
      if (billItems.length === 0) { showToast("Bill is empty!", "error"); return; }

      const today = new Date();
      const dateStr = today.toLocaleDateString() + " " + today.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      let custName = "Walk-in Customer";
      let custId = "N/A";
      if(activeCustomer) { custName = activeCustomer.name; custId = activeCustomer.phone; }

      document.getElementById('print-date').innerText = dateStr;
      document.getElementById('print-inv').innerText = "INV-" + invoiceCounter;
      document.getElementById('print-cust-name').innerText = custName;
      document.getElementById('print-cust-id').innerText = custId;

      const printBody = document.getElementById('print-receipt-body');
      printBody.innerHTML = '';
      let subTotal = 0;

      billItems.forEach(item => {
        subTotal += item.total;
        printBody.innerHTML += `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price.toFixed(2)}</td><td>${item.total.toFixed(2)}</td></tr>`;
      });

      const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
      const discountAmount = (subTotal * discountPercent) / 100;
      let finalTotal = subTotal - discountAmount;
      if(finalTotal < 0) finalTotal = 0;

      document.getElementById('print-subtotal').innerText = subTotal.toFixed(2);
      document.getElementById('print-discount').innerText = discountAmount.toFixed(2) + " (" + discountPercent + "%)";
      document.getElementById('print-grandtotal').innerText = finalTotal.toFixed(2);

      let billProfit = 0;
      billItems.forEach(item => {
        let medIndex = medicines.findIndex(m => m.id === item.medId);
        if(medIndex !== -1) {
          const purchaseCost = medicines[medIndex].purPrice * item.qty;
          billProfit += item.total - purchaseCost;
          medicines[medIndex].stock -= item.qty;
        }
      });

      saveData();

      salesRecords.push({
        invoice: invoiceCounter, date: dateStr, customer: custName,
        items: billItems.map(i => ({ medId: i.medId, name: i.name, qty: i.qty, total: i.total, profit: (i.total - (medicines.find(m=>m.id===i.medId)?.purPrice || 0)*i.qty) })),
        totalSale: finalTotal, discount: discountAmount, profit: billProfit
      });
      localStorage.setItem('aliSalesRecords', JSON.stringify(salesRecords));

      if(activeCustomer) {
        activeCustomer.totalPurchases = (activeCustomer.totalPurchases || 0) + finalTotal;
        if(!activeCustomer.history) activeCustomer.history = [];
        activeCustomer.history.push({ date: dateStr, items: [...billItems], total: finalTotal });
        saveCustomerData();
      }

      invoiceCounter++;
      localStorage.setItem('aliInvoiceCounter', invoiceCounter);

      window.print();

      billItems = [];
      updateBillTable();
      document.getElementById('discountInput').value = 0;
      resetBillingForm();
      renderMedicinesTable();
      updateDashboard();
      showToast("Bill saved and printed successfully!", "success");
    }

    // ==================== ALERTS ====================
    function renderAlerts() {
      const tbody = document.getElementById('alertsTableBody');
      tbody.innerHTML = '';
      let alertCount = 0;
      const today = new Date();

      medicines.forEach(med => {
        let isLowStock = med.stock <= 10;
        let isExpiring = false;
        let expMsg = "";
        
        if(med.expiryDate) {
          const expDate = new Date(med.expiryDate);
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          if(diffDays < 0) {
            isExpiring = true;
            expMsg = "EXPIRED!";
          } else if (diffDays <= 30) {
            isExpiring = true;
            expMsg = `Expiring in ${diffDays} days`;
          }
        }

        if(isLowStock || isExpiring) {
          alertCount++;
          let stockMsg = isLowStock ? (med.stock === 0 ? "Out of Stock!" : med.stock + " Units Left") : "OK";
          let expiryMsg = isExpiring ? `<span class="danger-text">${expMsg}</span>` : "OK";
          
          tbody.innerHTML += `<tr>
            <td><b>${med.name}</b></td>
            <td class="${isLowStock ? 'danger-text' : ''}">${stockMsg}</td>
            <td>${expiryMsg}</td>
          </tr>`;
        }
      });
      
      if(alertCount === 0) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:green;">✅ All items are well stocked & not expiring soon!</td></tr>'; }
    }

    // ==================== PROFIT ANALYTICS ====================
    function calculateAnalytics() {
      let totalSale = 0, totalPurchase = 0, totalProfit = 0;
      let supplierData = {};

      salesRecords.forEach(record => {
        totalSale += record.totalSale;
        totalProfit += record.profit;

        record.items.forEach(item => {
          const med = medicines.find(m => m.id === item.medId);
          if(!med) return;

          const itemPurchaseCost = med.purPrice * item.qty;
          totalPurchase += itemPurchaseCost;

          const supplierName = med.mfg || "Unknown";
          if(!supplierData[supplierName]) supplierData[supplierName] = { sold: 0, purchase: 0, sale: 0, profit: 0 };

          supplierData[supplierName].sold += item.qty;
          supplierData[supplierName].purchase += itemPurchaseCost;
          supplierData[supplierName].sale += item.total;
          supplierData[supplierName].profit += (item.total - itemPurchaseCost);
        });
      });

      document.getElementById('ana-total-sale').innerText = "Rs. " + totalSale.toFixed(2);
      document.getElementById('ana-total-purchase').innerText = "Rs. " + totalPurchase.toFixed(2);
      document.getElementById('ana-total-profit').innerText = "Rs. " + totalProfit.toFixed(2);

      const tbody = document.getElementById('supplierProfitTableBody');
      tbody.innerHTML = '';

      if(Object.keys(supplierData).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No sales data available yet.</td></tr>';
      } else {
        const sortedSuppliers = Object.keys(supplierData).sort((a, b) => supplierData[b].profit - supplierData[a].profit);
        sortedSuppliers.forEach(supp => {
          const data = supplierData[supp];
          let profitClass = data.profit > 0 ? "success-text" : "danger-text";
          tbody.innerHTML += `<tr><td><b>${supp}</b></td><td>${data.sold}</td><td>Rs. ${data.purchase.toFixed(2)}</td><td>Rs. ${data.sale.toFixed(2)}</td><td class="${profitClass}">Rs. ${data.profit.toFixed(2)}</td></tr>`;
        });
      }
    }

    function saveData() { localStorage.setItem('aliMedicines', JSON.stringify(medicines)); }

    // ==================== KEYBOARD SHORTCUTS ====================
    document.addEventListener('keydown', function(event) {
      if(document.getElementById('app-screen').classList.contains('hidden')) return;
      if (event.ctrlKey && event.key.toLowerCase() === 'n') { event.preventDefault(); showPage('inventory'); setTimeout(() => document.getElementById('medName').focus(), 100); }
      if (event.ctrlKey && event.key.toLowerCase() === 'b') { event.preventDefault(); showPage('billing'); }
      if (event.ctrlKey && event.key.toLowerCase() === 'd') { event.preventDefault(); showPage('dashboard'); }
    });

    // ==================== INITIALIZE ====================
    renderMedicinesTable();
    renderCustomersTable();
    renderCompanies();
    renderDistributors();
    loadDistributorDropdowns();
    updateDashboard();
