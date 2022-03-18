const paypalBtns = document.querySelector("#checkout__btn-paypal").parentElement;
const csrf = paypalBtns.querySelector("input").value;

paypal.Buttons({
  style: {
    layout:  'vertical',
    color:   'blue',
    shape:   'rect',
    label:   'checkout'
  },
  createOrder: ()=>{
    return fetch("/checkout",{
      method: "POST",
      headers: {
        "Content-Type": 'application/json',
        "csrf-token": csrf
      },
      body: ""
    })
    .then(res=>{
      if(res.ok){
        return res.json();
      }
      return res.json().then(json=> Promise.reject(json));
    })
    .then(({id})=>{
      return id;
    })
    .catch(err =>{
      console.log(err);
    })
  },
  onApprove: (data, actions)=>{
    const element = document.getElementById('checkout__btn-paypal');
    return actions.order.capture()
      .then(()=>{
        element.innerHTML = `
          <h3>Thank you for your payment!</h3>
        `;
        return fetch("/orders",{
          method: "POST",
          headers: {
            "Content-Type": 'application/json',
            "csrf-token": csrf
          },
          body: ""
        })
      })
      .then(res=>{
        if(res.ok){
          return res.json();
        }
        return res.json().them(json=> Promise.reject(json));
      })
      .then(({url}) =>{
        window.location.replace(url);
      })
      .catch(err =>{
        element.innerHTML = `<h3>Sorry Something Went Wrong Error ${err}, Please, Try Again Later.</h3>`;
      })
  }
}).render('#checkout__btn-paypal');