import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, Modal, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";

// Load data from AsyncStorage
const loadFromAsyncStorage = async (key, defaultValue) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from AsyncStorage:`, error);
    return defaultValue;
  }
};

// Save data to AsyncStorage
const saveToAsyncStorage = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to AsyncStorage:`, error);
  }
};

const ShoppingListApp = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [editItemId, setEditItemId] = useState(null);
  const [editItemText, setEditItemText] = useState("");
  const [editItemQuantity, setEditItemQuantity] = useState("1");
  const [savedLists, setSavedLists] = useState({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [saveConfirmation, setSaveConfirmation] = useState("");

  // Load saved items and lists from AsyncStorage on initial render
  useEffect(() => {
    const loadData = async () => {
      const savedItems = await loadFromAsyncStorage("shoppingList", []);
      const savedListsData = await loadFromAsyncStorage("savedLists", {});
      setItems(savedItems);
      setSavedLists(savedListsData);
      console.log("Loaded savedLists:", savedListsData); // Debugging
    };
    loadData();
  }, []);

  // Save items and lists to AsyncStorage whenever they change
  useEffect(() => {
    saveToAsyncStorage("shoppingList", items);
    saveToAsyncStorage("savedLists", savedLists);
  }, [items, savedLists]);

  const addItem = () => {
    if (newItem.trim() === "") return;
    const newItemObject = {
      id: Date.now(),
      text: newItem,
      quantity: parseInt(newQuantity, 10),
      found: false,
    };
    setItems([...items, newItemObject]);
    setNewItem("");
    setNewQuantity("1");
  };

  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const startEdit = (id, text, quantity) => {
    setEditItemId(id);
    setEditItemText(text);
    setEditItemQuantity(quantity.toString());
  };

  const saveEdit = () => {
    setItems(
      items.map((item) =>
        item.id === editItemId
          ? { ...item, text: editItemText, quantity: parseInt(editItemQuantity, 10) }
          : item
      )
    );
    setEditItemId(null);
    setEditItemText("");
    setEditItemQuantity("1");
  };

  const toggleFound = (id) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, found: !item.found } : item
      )
    );
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const openSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
    setListName("");
    setSaveConfirmation("");
  };

  const handleSaveList = () => {
    if (listName.trim() === "") {
      setSaveConfirmation("Please enter a valid list name.");
      return;
    }
    const updatedSavedLists = { ...savedLists, [listName]: items };
    setSavedLists(updatedSavedLists);
    setSaveConfirmation(`List "${listName}" saved successfully!`);
    setTimeout(() => {
      closeSaveModal();
    }, 1500);
  };

  const loadList = (listName) => {
    const listToLoad = savedLists[listName];
    if (listToLoad) {
      setItems(listToLoad);
    }
  };

  const deleteList = (listName) => {
    const updatedLists = { ...savedLists };
    delete updatedLists[listName];
    setSavedLists(updatedLists);
  };

  // Calculate total quantity of marked items
  const totalMarkedQuantity = items
    .filter((item) => item.found)
    .reduce((sum, item) => sum + item.quantity, 0);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => toggleFound(item.id)}>
        <Icon
          name={item.found ? "check-square-o" : "square-o"}
          size={24}
          color="#4CAF50"
        />
      </TouchableOpacity>
      <View style={styles.itemDetails}>
        {editItemId === item.id ? (
          <TextInput
            style={styles.editInput}
            value={editItemText}
            onChangeText={setEditItemText}
          />
        ) : (
          <Text style={[styles.itemText, item.found && styles.strikethrough]}>
            {item.text}
          </Text>
        )}
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
            <Icon name="minus" size={16} color="#555" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
            <Icon name="plus" size={16} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.actions}>
        {editItemId === item.id ? (
          <TouchableOpacity onPress={saveEdit}>
            <Icon name="save" size={24} color="#4CAF50" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => startEdit(item.id, item.text, item.quantity)}>
            <Icon name="edit" size={24} color="#FFC107" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => deleteItem(item.id)}>
          <Icon name="trash" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <View style={styles.cartIcon}>
          <Icon name="shopping-cart" size={24} color="#000" />
          <Text style={styles.cartCount}>{totalMarkedQuantity}</Text>
        </View>
      </View>

      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add a new item"
        />
        <TextInput
          style={styles.quantityInput}
          value={newQuantity}
          onChangeText={setNewQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Icon name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />

      <TouchableOpacity style={styles.saveButton} onPress={openSaveModal}>
        <Text style={styles.saveButtonText}>Save List</Text>
      </TouchableOpacity>

      <Modal visible={isSaveModalOpen} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save List</Text>
            <TextInput
              style={styles.modalInput}
              value={listName}
              onChangeText={setListName}
              placeholder="Enter list name"
            />
            {saveConfirmation && (
              <Text style={styles.confirmationText}>{saveConfirmation}</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeSaveModal}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalButton} onPress={handleSaveList}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Display Saved Lists */}
      <View style={styles.savedListsContainer}>
        <Text style={styles.savedListsTitle}>Saved Lists:</Text>
        {Object.keys(savedLists).map((listName) => (
          <View key={listName} style={styles.savedList}>
            <TouchableOpacity onPress={() => loadList(listName)}>
              <Text style={styles.savedListName}>{listName}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteList(listName)}>
              <Icon name="trash" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  cartIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartCount: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "bold",
  },
  addItemContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  quantityInput: {
    width: 60,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#2196F3",
    borderRadius: 4,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemText: {
    fontSize: 16,
  },
  strikethrough: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  confirmationText: {
    color: "#4CAF50",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    backgroundColor: "#F44336",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  saveModalButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    padding: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  savedListsContainer: {
    marginTop: 16,
  },
  savedListsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  savedList: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 4,
    marginBottom: 8,
  },
  savedListName: {
    fontSize: 16,
  },
});

export default ShoppingListApp;